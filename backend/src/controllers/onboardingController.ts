import { Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const toggleTaskSchema = z.object({
  is_completed: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
}).refine(
  (data) => data.is_completed !== undefined || data.isCompleted !== undefined,
  { message: 'is_completed or isCompleted boolean is required', path: ['is_completed'] }
);

/**
 * 1. GET /api/onboarding/me & GET /api/onboarding & GET /api/onboarding/:applicationId
 * Retrieves onboarding tasks for candidate or HR management.
 */
export async function getOnboardingTasks(req: Request, res: Response): Promise<void> {
  try {
    const callerUid = req.user?.uid;
    const callerRole = (req.user?.role || '').toUpperCase();

    if (!callerUid) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required prior to retrieving onboarding tasks', statusCode: 401 },
      });
      return;
    }

    const targetAppId = req.params.applicationId || (req.query.application_id as string) || (req.query.applicationId as string);
    if (targetAppId && !UUID_REGEX.test(targetAppId)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid applicationId format. Must be a valid UUID', statusCode: 400 },
      });
      return;
    }

    if (callerRole === 'CANDIDATE') {
      // Resolve candidate profile ID
      const candRes = await query(
        `SELECT cp.id AS candidate_profile_id
         FROM candidate_profiles cp
         JOIN users u ON cp.user_id = u.id
         WHERE u.firebase_uid = $1
         LIMIT 1;`,
        [callerUid]
      );

      if (candRes.rows.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            tasks: [],
            stats: { total: 0, completed: 0, pending: 0, percentComplete: 0 },
          },
          tasks: [],
        });
        return;
      }

      const candidateProfileId = candRes.rows[0].candidate_profile_id;

      let sql = `
        SELECT 
          ot.id,
          ot.candidate_id,
          ot.offer_id,
          ot.application_id,
          ot.title,
          ot.description,
          ot.category,
          ot.is_completed,
          ot.due_date,
          ot.completed_at,
          ot.created_at,
          ot.updated_at,
          j.title AS job_title,
          c.name AS company_name
        FROM onboarding_tasks ot
        LEFT JOIN applications a ON ot.application_id = a.id
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE ot.candidate_id = $1
      `;
      const params: any[] = [candidateProfileId];

      if (targetAppId) {
        // Enforce candidate ownership guard on target application
        const appCheck = await query(
          'SELECT candidate_id FROM applications WHERE id = $1 LIMIT 1;',
          [targetAppId]
        );
        if (appCheck.rows.length === 0) {
          res.status(404).json({
            success: false,
            error: { message: 'Application not found', statusCode: 404 },
          });
          return;
        }
        if (appCheck.rows[0].candidate_id !== candidateProfileId) {
          res.status(403).json({
            success: false,
            error: {
              message: 'Forbidden: You do not have permission to view onboarding tasks for this application',
              statusCode: 403,
            },
          });
          return;
        }
        sql += ` AND ot.application_id = $2`;
        params.push(targetAppId);
      }

      sql += ` ORDER BY ot.due_date ASC NULLS LAST, ot.created_at ASC;`;

      const result = await query(sql, params);
      const tasks = result.rows.map((r) => ({
        id: r.id,
        candidateId: r.candidate_id,
        candidate_id: r.candidate_id,
        offerId: r.offer_id,
        offer_id: r.offer_id,
        applicationId: r.application_id,
        application_id: r.application_id,
        title: r.title,
        description: r.description,
        category: r.category,
        isCompleted: r.is_completed,
        is_completed: r.is_completed,
        dueDate: r.due_date,
        due_date: r.due_date,
        completedAt: r.completed_at,
        completed_at: r.completed_at,
        createdAt: r.created_at,
        created_at: r.created_at,
        updatedAt: r.updated_at,
        updated_at: r.updated_at,
        jobTitle: r.job_title,
        companyName: r.company_name,
      }));

      const total = tasks.length;
      const completed = tasks.filter((t) => t.isCompleted).length;
      const pending = total - completed;
      const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

      res.status(200).json({
        success: true,
        data: {
          tasks,
          stats: {
            total,
            completed,
            pending,
            percentComplete,
          },
        },
        tasks,
      });
      return;
    }

    // HR or ADMIN role
    let hrCompanyId = req.user?.companyId;
    if (!hrCompanyId && callerRole === 'HR') {
      const userRes = await query('SELECT company_id FROM users WHERE firebase_uid = $1 LIMIT 1;', [callerUid]);
      hrCompanyId = userRes.rows[0]?.company_id || null;
    }

    let sql = `
      SELECT 
        ot.id,
        ot.candidate_id,
        ot.offer_id,
        ot.application_id,
        ot.title,
        ot.description,
        ot.category,
        ot.is_completed,
        ot.due_date,
        ot.completed_at,
        ot.created_at,
        ot.updated_at,
        j.title AS job_title,
        c.name AS company_name,
        u.full_name AS candidate_name,
        u.email AS candidate_email
      FROM onboarding_tasks ot
      JOIN candidate_profiles cp ON ot.candidate_id = cp.id
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN applications a ON ot.application_id = a.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (callerRole === 'HR') {
      if (!hrCompanyId) {
        res.status(403).json({
          success: false,
          error: { message: 'Forbidden: HR user has no assigned company', statusCode: 403 },
        });
        return;
      }
      sql += ` AND j.company_id = $${paramIndex++}`;
      params.push(hrCompanyId);
    } else if (callerRole === 'ADMIN' && req.user?.companyId) {
      sql += ` AND j.company_id = $${paramIndex++}`;
      params.push(req.user.companyId);
    }

    if (targetAppId) {
      sql += ` AND ot.application_id = $${paramIndex++}`;
      params.push(targetAppId);
    }

    const targetCandId = (req.query.candidate_id as string) || (req.query.candidateId as string);
    if (targetCandId && UUID_REGEX.test(targetCandId)) {
      sql += ` AND ot.candidate_id = $${paramIndex++}`;
      params.push(targetCandId);
    }

    sql += ` ORDER BY ot.due_date ASC NULLS LAST, ot.created_at ASC;`;

    const result = await query(sql, params);
    const tasks = result.rows.map((r) => ({
      id: r.id,
      candidateId: r.candidate_id,
      candidate_id: r.candidate_id,
      offerId: r.offer_id,
      offer_id: r.offer_id,
      applicationId: r.application_id,
      application_id: r.application_id,
      title: r.title,
      description: r.description,
      category: r.category,
      isCompleted: r.is_completed,
      is_completed: r.is_completed,
      dueDate: r.due_date,
      due_date: r.due_date,
      completedAt: r.completed_at,
      completed_at: r.completed_at,
      createdAt: r.created_at,
      created_at: r.created_at,
      updatedAt: r.updated_at,
      updated_at: r.updated_at,
      jobTitle: r.job_title,
      companyName: r.company_name,
      candidateName: r.candidate_name,
      candidateEmail: r.candidate_email,
    }));

    const total = tasks.length;
    const completed = tasks.filter((t) => t.isCompleted).length;
    const pending = total - completed;
    const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        tasks,
        stats: {
          total,
          completed,
          pending,
          percentComplete,
        },
      },
      tasks,
    });
  } catch (error: any) {
    console.error('[OnboardingController] Error fetching onboarding tasks:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        message: error.message || 'Internal server error while fetching onboarding tasks',
        statusCode: error.statusCode || 500,
      },
    });
  }
}

/**
 * 2. PATCH /api/onboarding/:id
 * Toggles completion status of an onboarding task.
 * Candidate can toggle their own tasks.
 * HR/Admin can toggle tasks within their organization.
 */
export async function toggleOnboardingTask(req: Request, res: Response): Promise<void> {
  try {
    const callerUid = req.user?.uid;
    const callerRole = (req.user?.role || '').toUpperCase();

    if (!callerUid) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required prior to updating onboarding task', statusCode: 401 },
      });
      return;
    }

    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid onboarding task UUID format', statusCode: 400 },
      });
      return;
    }

    const parseResult = toggleTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { message: parseResult.error.errors[0]?.message || 'Invalid request body', statusCode: 400 },
      });
      return;
    }

    const targetCompleted =
      parseResult.data.is_completed !== undefined
        ? parseResult.data.is_completed
        : Boolean(parseResult.data.isCompleted);

    // Look up task and check row ownership
    const taskSql = `
      SELECT 
        ot.id,
        ot.candidate_id,
        ot.offer_id,
        ot.application_id,
        ot.title,
        ot.description,
        ot.category,
        ot.is_completed,
        ot.due_date,
        ot.completed_at,
        u.firebase_uid AS candidate_firebase_uid,
        j.company_id AS job_company_id
      FROM onboarding_tasks ot
      JOIN candidate_profiles cp ON ot.candidate_id = cp.id
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN applications a ON ot.application_id = a.id
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE ot.id = $1
      LIMIT 1;
    `;

    const taskRes = await query(taskSql, [id]);

    if (taskRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Onboarding task not found', statusCode: 404 },
      });
      return;
    }

    const taskRow = taskRes.rows[0];

    // Candidate ownership check
    if (callerRole === 'CANDIDATE') {
      if (taskRow.candidate_firebase_uid !== callerUid) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Forbidden: You do not have permission to modify this onboarding task',
            statusCode: 403,
          },
        });
        return;
      }
    } else if (callerRole === 'HR') {
      let hrCompanyId = req.user?.companyId;
      if (!hrCompanyId) {
        const userRes = await query('SELECT company_id FROM users WHERE firebase_uid = $1 LIMIT 1;', [callerUid]);
        hrCompanyId = userRes.rows[0]?.company_id || null;
      }
      if (!hrCompanyId) {
        res.status(403).json({
          success: false,
          error: { message: 'Forbidden: HR user has no assigned company', statusCode: 403 },
        });
        return;
      }
      if (taskRow.job_company_id && hrCompanyId !== taskRow.job_company_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Forbidden: Task does not belong to your organization',
            statusCode: 403,
          },
        });
        return;
      }
    } else if (callerRole === 'ADMIN') {
      const adminCompanyId = req.user?.companyId;
      if (adminCompanyId && taskRow.job_company_id && adminCompanyId !== taskRow.job_company_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Forbidden: Task does not belong to your organization',
            statusCode: 403,
          },
        });
        return;
      }
    } else if (callerRole !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        error: { message: 'Forbidden: Unauthorized role', statusCode: 403 },
      });
      return;
    }

    // Update task
    const updateSql = `
      UPDATE onboarding_tasks
      SET is_completed = $1,
          completed_at = CASE WHEN $1 = TRUE THEN CURRENT_TIMESTAMP ELSE NULL END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING 
        id,
        candidate_id,
        offer_id,
        application_id,
        title,
        description,
        category,
        is_completed,
        due_date,
        completed_at,
        created_at,
        updated_at;
    `;

    const updateRes = await query(updateSql, [targetCompleted, id]);
    const updated = updateRes.rows[0];

    const formattedTask = {
      id: updated.id,
      candidateId: updated.candidate_id,
      candidate_id: updated.candidate_id,
      offerId: updated.offer_id,
      offer_id: updated.offer_id,
      applicationId: updated.application_id,
      application_id: updated.application_id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      isCompleted: updated.is_completed,
      is_completed: updated.is_completed,
      dueDate: updated.due_date,
      due_date: updated.due_date,
      completedAt: updated.completed_at,
      completed_at: updated.completed_at,
      createdAt: updated.created_at,
      created_at: updated.created_at,
      updatedAt: updated.updated_at,
      updated_at: updated.updated_at,
    };

    res.status(200).json({
      success: true,
      message: `Onboarding task marked as ${targetCompleted ? 'completed' : 'pending'}`,
      data: formattedTask,
      task: formattedTask,
    });
  } catch (error: any) {
    console.error('[OnboardingController] Error updating task:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        message: error.message || 'Internal server error while updating onboarding task',
        statusCode: error.statusCode || 500,
      },
    });
  }
}
