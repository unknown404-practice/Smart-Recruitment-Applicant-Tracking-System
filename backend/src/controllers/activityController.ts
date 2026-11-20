import { Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const ACTIVITY_TYPES = [
  'STAGE_TRANSITION',
  'INTERVIEW_EVENT',
  'OFFER_EVENT',
  'NOTIFICATION_DISPATCH',
  'ONBOARDING_UPDATE',
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];

/**
 * Zod validation schema for Activity Query parameters
 */
export const activityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  activityType: z.enum([...ACTIVITY_TYPES] as [string, ...string[]]).optional(),
  companyId: z.string().regex(UUID_REGEX, 'companyId must be a valid UUID').optional(),
  candidateId: z.string().regex(UUID_REGEX, 'candidateId must be a valid UUID').optional(),
  applicationId: z.string().regex(UUID_REGEX, 'applicationId must be a valid UUID').optional(),
  search: z.string().max(200).optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

/**
 * Escapes characters with special meaning in SQL LIKE / ILIKE patterns.
 */
function escapeSqlLike(str: string): string {
  return str.replace(/([%_\\])/g, '\\$1');
}

/**
 * GET /api/activity
 * Aggregated activity audit feed with tenant boundaries, multi-criteria filtering, and pagination.
 */
export async function getActivityFeed(req: Request, res: Response): Promise<void> {
  try {
    const callerRole = (req.user?.role || '').toUpperCase();
    const callerCompanyId = req.user?.companyId;

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required prior to accessing activity log', statusCode: 401 },
      });
      return;
    }

    // Role-based access control (SEC-06)
    const isGlobalAdmin = callerRole === 'ADMIN' || callerRole === 'SUPER_ADMIN';
    const isCompanyStaff = callerRole === 'HR' || callerRole === 'HR_MANAGER' || callerRole === 'RECRUITER';

    if (!isGlobalAdmin && !isCompanyStaff) {
      res.status(403).json({
        success: false,
        error: { message: 'Forbidden: Insufficient privileges to view system activity log', statusCode: 403 },
      });
      return;
    }

    // Parse and validate query parameters
    const parseResult = activityQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid activity query parameters',
          statusCode: 400,
          details: parseResult.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { page, limit, activityType, companyId, candidateId, applicationId, search, startDate, endDate } =
      parseResult.data;

    // Validate date sequence if both provided
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && s.getTime() > e.getTime()) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid activity query parameters: startDate cannot be after endDate',
            statusCode: 400,
          },
        });
        return;
      }
    }

    // Multi-tenant boundary enforcement
    let effectiveCompanyId: string | null = null;
    if (isCompanyStaff) {
      if (!callerCompanyId) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Forbidden: HR user is not associated with an authorized corporate tenant',
            statusCode: 403,
          },
        });
        return;
      }
      if (companyId && companyId !== callerCompanyId) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Forbidden: Cross-tenant activity log access is strictly prohibited',
            statusCode: 403,
          },
        });
        return;
      }
      effectiveCompanyId = callerCompanyId;
    } else if (isGlobalAdmin) {
      effectiveCompanyId = companyId || callerCompanyId || null;
    }

    // Build parameterized WHERE conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (effectiveCompanyId) {
      conditions.push(`company_id = $${paramIndex}`);
      values.push(effectiveCompanyId);
      paramIndex++;
    }

    if (candidateId) {
      conditions.push(`candidate_id = $${paramIndex}`);
      values.push(candidateId);
      paramIndex++;
    }

    if (applicationId) {
      conditions.push(`application_id = $${paramIndex}`);
      values.push(applicationId);
      paramIndex++;
    }

    if (activityType) {
      conditions.push(`activity_type = $${paramIndex}`);
      values.push(activityType);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      // If YYYY-MM-DD was provided, include the complete end date day
      const normalizedEndDate = /^\d{4}-\d{2}-\d{2}$/.test(endDate)
        ? `${endDate}T23:59:59.999Z`
        : endDate;
      values.push(normalizedEndDate);
      paramIndex++;
    }

    if (search && search.trim()) {
      const sanitized = escapeSqlLike(search.trim());
      conditions.push(
        `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR candidate_name ILIKE $${paramIndex} OR job_title ILIKE $${paramIndex} OR actor_name ILIKE $${paramIndex} OR action ILIKE $${paramIndex})`
      );
      values.push(`%${sanitized}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query for total matching rows
    const countSql = `SELECT COUNT(*)::INTEGER AS total FROM v_system_activity_feed ${whereClause};`;
    const countResult = await query(countSql, values);
    const total = countResult.rows[0]?.total || 0;

    // Offset arithmetic
    const offset = (page - 1) * limit;

    // Data query
    const dataSql = `
      SELECT 
        id,
        activity_type,
        entity_type,
        entity_id,
        company_id,
        actor_id,
        actor_name,
        actor_email,
        actor_role,
        candidate_id,
        candidate_name,
        candidate_email,
        job_id,
        job_title,
        application_id,
        action,
        title,
        description,
        metadata,
        created_at
      FROM v_system_activity_feed
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;

    const dataValues = [...values, limit, offset];
    const dataResult = await query(dataSql, dataValues);

    res.status(200).json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: offset + dataResult.rows.length < total,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to retrieve unified system activity feed',
        statusCode: 500,
      },
    });
  }
}

/**
 * GET /api/activity/types
 * Returns registered activity event taxonomy and types.
 */
export async function getActivityTypes(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: ACTIVITY_TYPES,
  });
}
