import { Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isCandidate(req: Request, res: Response): boolean {
  if (!req.user?.uid) {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required', statusCode: 401 },
    });
    return false;
  }

  if ((req.user.role || '').toUpperCase() !== 'CANDIDATE') {
    res.status(403).json({
      success: false,
      error: { message: 'Only candidates can access onboarding tasks', statusCode: 403 },
    });
    return false;
  }

  return true;
}

/**
 * GET /api/onboarding
 * Lists onboarding tasks belonging to the authenticated candidate.
 */
export async function getMyOnboardingTasks(req: Request, res: Response): Promise<void> {
  if (!isCandidate(req, res)) return;

  try {
    const result = await query(
      `
        SELECT
          ot.id,
          ot.offer_id,
          ot.title,
          ot.description,
          ot.is_completed,
          ot.due_date,
          ot.completed_at,
          ot.created_at,
          ot.updated_at
        FROM onboarding_tasks ot
        JOIN candidate_profiles cp ON ot.candidate_id = cp.id
        JOIN users u ON cp.user_id = u.id
        WHERE u.firebase_uid = $1
        ORDER BY ot.due_date ASC NULLS LAST, ot.created_at ASC;
      `,
      [req.user!.uid]
    );

    res.status(200).json({
      success: true,
      data: {
        tasks: result.rows.map((task) => ({
          id: task.id,
          offerId: task.offer_id,
          title: task.title,
          description: task.description,
          isCompleted: task.is_completed,
          dueDate: task.due_date,
          completedAt: task.completed_at,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
        })),
      },
    });
  } catch (error) {
    console.error('[OnboardingController] Failed to retrieve tasks:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve onboarding tasks', statusCode: 500 },
    });
  }
}

/**
 * PATCH /api/onboarding/:id
 * Updates completion state for a task owned by the authenticated candidate.
 */
export async function updateOnboardingTask(req: Request, res: Response): Promise<void> {
  if (!isCandidate(req, res)) return;

  const { id } = req.params;

  if (!id || !UUID_REGEX.test(id)) {
    res.status(400).json({
      success: false,
      error: { message: 'Invalid onboarding task UUID format', statusCode: 400 },
    });
    return;
  }

  const bodySchema = z.object({
    isCompleted: z.boolean(),
  });

  const parsed = bodySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { message: 'isCompleted must be a boolean', statusCode: 400 },
    });
    return;
  }

  try {
    const result = await query(
      `
        UPDATE onboarding_tasks ot
        SET
          is_completed = $1,
          completed_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE NULL END,
          updated_at = CURRENT_TIMESTAMP
        FROM candidate_profiles cp
        JOIN users u ON cp.user_id = u.id
        WHERE ot.id = $2
          AND ot.candidate_id = cp.id
          AND u.firebase_uid = $3
        RETURNING
          ot.id,
          ot.offer_id,
          ot.title,
          ot.description,
          ot.is_completed,
          ot.due_date,
          ot.completed_at,
          ot.updated_at;
      `,
      [parsed.data.isCompleted, id, req.user!.uid]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Onboarding task not found', statusCode: 404 },
      });
      return;
    }

    const task = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Onboarding task updated successfully',
      data: {
        task: {
          id: task.id,
          offerId: task.offer_id,
          title: task.title,
          description: task.description,
          isCompleted: task.is_completed,
          dueDate: task.due_date,
          completedAt: task.completed_at,
          updatedAt: task.updated_at,
        },
      },
    });
  } catch (error) {
    console.error('[OnboardingController] Failed to update task:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update onboarding task', statusCode: 500 },
    });
  }
}
