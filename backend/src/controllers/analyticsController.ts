import { Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Zod validation schema for Analytics Summary Query parameters
 */
export const analyticsQuerySchema = z.object({
  jobId: z
    .string()
    .trim()
    .regex(UUID_REGEX, 'Invalid jobId format. Must be a valid UUID')
    .optional(),
  department: z
    .string()
    .trim()
    .max(100, 'Department must not exceed 100 characters')
    .optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  companyId: z
    .string()
    .trim()
    .regex(UUID_REGEX, 'Invalid companyId format. Must be a valid UUID')
    .optional(),
});

export interface DateBoundary {
  date: Date;
  iso: string;
}

/**
 * Normalizes date inputs to UTC boundaries.
 * - Date-only (YYYY-MM-DD):
 *   - Start: inclusive UTC day boundary (YYYY-MM-DDT00:00:00.000Z).
 *   - End: exclusive UTC day boundary using the beginning of the following UTC day (YYYY-MM-(DD+1)T00:00:00.000Z).
 * - Datetime: parses timezone offset and normalizes to UTC instant.
 */
export function normalizeDateBoundary(dateStr: string, isEndDate: boolean): DateBoundary | null {
  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnlyRegex.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    const testDate = new Date(Date.UTC(year, month - 1, day));
    if (
      testDate.getUTCFullYear() !== year ||
      testDate.getUTCMonth() !== month - 1 ||
      testDate.getUTCDate() !== day
    ) {
      return null;
    }

    if (isEndDate) {
      const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
      return { date: nextDay, iso: nextDay.toISOString() };
    }
    const startDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    return { date: startDay, iso: startDay.toISOString() };
  }

  // Parse ISO datetime or general date
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return null;
  }
  return { date: parsed, iso: parsed.toISOString() };
}

/**
 * Helper to round to 1 decimal place safely
 */
function roundToOneDecimal(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

/**
 * GET /api/analytics/summary
 * Computes hiring KPIs (Total Application Volume, Stage Conversion Rates,
 * Average Time-to-Hire, and Offer Acceptance Rate) with multi-tenant boundaries.
 */
export async function getAnalyticsSummary(req: Request, res: Response): Promise<void> {
  try {
    const callerUid = req.user?.uid;
    const callerRole = (req.user?.role || '').toUpperCase();
    let callerCompanyId = req.user?.companyId;

    if (!callerUid) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required prior to accessing analytics', statusCode: 401 },
      });
      return;
    }

    if (callerRole === 'CANDIDATE') {
      res.status(403).json({
        success: false,
        error: { message: 'Forbidden: Candidates are not permitted to access analytics', statusCode: 403 },
      });
      return;
    }

    // Validate query parameters
    const parseResult = analyticsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid analytics query parameters';
      res.status(400).json({
        success: false,
        error: { message: firstError, statusCode: 400 },
      });
      return;
    }

    const { jobId, department, startDate: rawStartDate, endDate: rawEndDate, companyId: requestedCompanyId } =
      parseResult.data;

    // Resolve caller's companyId from DB if not populated in JWT claims
    if (!callerCompanyId && callerRole !== 'SUPER_ADMIN') {
      const userRes = await query(
        'SELECT company_id, is_active FROM users WHERE firebase_uid = $1 LIMIT 1;',
        [callerUid]
      );
      if (userRes.rows.length > 0) {
        callerCompanyId = userRes.rows[0].company_id || null;
      }
    }

    // Staff without assigned company cannot access analytics
    if (!callerCompanyId && callerRole !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Forbidden: Staff user is not associated with an authorized corporate tenant',
          statusCode: 403,
        },
      });
      return;
    }

    // Strict multi-tenant isolation: Never trust user-supplied companyId for regular staff
    if (callerRole !== 'SUPER_ADMIN') {
      if (requestedCompanyId && requestedCompanyId !== callerCompanyId) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Forbidden: Cross-tenant analytics access is strictly prohibited',
            statusCode: 403,
          },
        });
        return;
      }
    }

    const effectiveCompanyId =
      callerRole === 'SUPER_ADMIN' ? (requestedCompanyId || callerCompanyId || null) : callerCompanyId;

    // Validate and normalize startDate and endDate
    let normalizedStartIso: string | null = null;
    let normalizedEndIso: string | null = null;
    let startInstant: Date | null = null;
    let endInstant: Date | null = null;

    if (rawStartDate) {
      const startResult = normalizeDateBoundary(rawStartDate, false);
      if (!startResult) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid startDate format. Must be a valid date or ISO datetime string',
            statusCode: 400,
          },
        });
        return;
      }
      normalizedStartIso = startResult.iso;
      startInstant = startResult.date;
    }

    if (rawEndDate) {
      const endResult = normalizeDateBoundary(rawEndDate, true);
      if (!endResult) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid endDate format. Must be a valid date or ISO datetime string',
            statusCode: 400,
          },
        });
        return;
      }
      normalizedEndIso = endResult.iso;
      endInstant = endResult.date;
    }

    if (startInstant && endInstant && startInstant.getTime() >= endInstant.getTime()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid date range: startDate must be earlier than endDate',
          statusCode: 400,
        },
      });
      return;
    }

    // If jobId is provided, verify it exists and belongs to the caller's corporate tenant
    if (jobId) {
      const jobCheck = await query('SELECT id, company_id, title FROM jobs WHERE id = $1 LIMIT 1;', [jobId]);
      if (jobCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: { message: 'Job not found', statusCode: 404 },
        });
        return;
      }
      const targetJob = jobCheck.rows[0];
      if (effectiveCompanyId && targetJob.company_id !== effectiveCompanyId) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Forbidden: Job does not belong to your organization',
            statusCode: 403,
          },
        });
        return;
      }
    }

    /**
     * Unified PostgreSQL Analytical CTE Query:
     * Operates over a single cohort of applications scoped by tenant, optional jobId,
     * optional department, and applied_at date boundary.
     *
     * Funnel Stage Definitions:
     * - APPLIED: All applications created in the cohort.
     * - SCREENING: Unique applications that reached SCREENING or beyond.
     * - INTERVIEW: Unique applications that reached INTERVIEW or beyond.
     * - SELECTED: Unique applications that reached SELECTED or beyond.
     * - OFFERED: Unique applications with an offer issued or reached OFFERED stage.
     * - HIRED: Unique applications that reached terminal HIRED stage.
     *
     * Conversion Formulas:
     * - Screening conversion = screened / applied × 100
     * - Interview conversion = interviewed / screened × 100
     * - Selection conversion = selected / interviewed × 100
     * - Offer conversion = offered / interviewed × 100
     * - Hiring conversion = hired / offered × 100
     */
    const analyticsSql = `
      WITH cohort AS (
        SELECT
          a.id AS application_id,
          a.applied_at,
          a.current_stage,
          a.hired_at,
          j.id AS job_id,
          j.company_id,
          j.department
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE ($1::uuid IS NULL OR j.company_id = $1)
          AND ($2::uuid IS NULL OR j.id = $2)
          AND ($3::text IS NULL OR LOWER(j.department) = LOWER($3))
          AND ($4::timestamptz IS NULL OR a.applied_at >= $4)
          AND ($5::timestamptz IS NULL OR a.applied_at < $5)
      ),
      stage_metrics AS (
        SELECT
          COUNT(*)::int AS total_applied,
          COUNT(CASE WHEN c.current_stage IN ('SCREENING', 'INTERVIEW', 'SELECTED', 'OFFERED', 'HIRED')
                     OR EXISTS (SELECT 1 FROM application_stage_history ash WHERE ash.application_id = c.application_id AND ash.to_stage = 'SCREENING')
                     THEN 1 END)::int AS screened_count,
          COUNT(CASE WHEN c.current_stage IN ('INTERVIEW', 'SELECTED', 'OFFERED', 'HIRED')
                     OR EXISTS (SELECT 1 FROM application_stage_history ash WHERE ash.application_id = c.application_id AND ash.to_stage = 'INTERVIEW')
                     THEN 1 END)::int AS interview_count,
          COUNT(CASE WHEN c.current_stage IN ('SELECTED', 'OFFERED', 'HIRED')
                     OR EXISTS (SELECT 1 FROM application_stage_history ash WHERE ash.application_id = c.application_id AND ash.to_stage = 'SELECTED')
                     THEN 1 END)::int AS selected_count,
          COUNT(CASE WHEN c.current_stage IN ('OFFERED', 'HIRED')
                     OR EXISTS (SELECT 1 FROM application_stage_history ash WHERE ash.application_id = c.application_id AND ash.to_stage = 'OFFERED')
                     OR EXISTS (SELECT 1 FROM offer_records o WHERE o.application_id = c.application_id AND o.status != 'DRAFT')
                     THEN 1 END)::int AS offered_count,
          COUNT(CASE WHEN c.current_stage = 'HIRED'
                     OR c.hired_at IS NOT NULL
                     OR EXISTS (SELECT 1 FROM application_stage_history ash WHERE ash.application_id = c.application_id AND ash.to_stage = 'HIRED')
                     THEN 1 END)::int AS hired_count
        FROM cohort c
      ),
      time_metrics AS (
        SELECT
          COALESCE(
            ROUND(
              AVG(
                EXTRACT(EPOCH FROM (COALESCE(c.hired_at, ash.hired_timestamp) - c.applied_at)) / 86400.0
              )::numeric,
              1
            ),
            0.0
          )::float AS avg_time_to_hire_days
        FROM cohort c
        LEFT JOIN LATERAL (
          SELECT changed_at AS hired_timestamp
          FROM application_stage_history
          WHERE application_id = c.application_id AND to_stage = 'HIRED'
          ORDER BY changed_at DESC
          LIMIT 1
        ) ash ON true
        WHERE (c.current_stage = 'HIRED' OR c.hired_at IS NOT NULL OR ash.hired_timestamp IS NOT NULL)
          AND c.applied_at IS NOT NULL
          AND COALESCE(c.hired_at, ash.hired_timestamp) >= c.applied_at
      ),
      offer_metrics AS (
        SELECT
          COUNT(CASE WHEN o.status != 'DRAFT' THEN 1 END)::int AS total_offers,
          COUNT(CASE WHEN o.status = 'ACCEPTED' THEN 1 END)::int AS accepted_offers,
          COUNT(CASE WHEN o.status = 'DECLINED' THEN 1 END)::int AS declined_offers,
          COUNT(CASE WHEN o.status = 'ISSUED' THEN 1 END)::int AS pending_offers,
          COUNT(CASE WHEN o.status = 'EXPIRED' THEN 1 END)::int AS expired_offers,
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN o.status = 'ACCEPTED' THEN 1 END)::numeric /
               NULLIF(COUNT(CASE WHEN o.status IN ('ACCEPTED', 'DECLINED') THEN 1 END), 0) * 100)::numeric,
              1
            ),
            0.0
          )::float AS acceptance_rate
        FROM offer_records o
        JOIN cohort c ON o.application_id = c.application_id
      )
      SELECT
        s.total_applied,
        s.screened_count,
        s.interview_count,
        s.selected_count,
        s.offered_count,
        s.hired_count,
        COALESCE(t.avg_time_to_hire_days, 0.0)::float AS avg_time_to_hire_days,
        COALESCE(o.total_offers, 0)::int AS total_offers,
        COALESCE(o.accepted_offers, 0)::int AS accepted_offers,
        COALESCE(o.declined_offers, 0)::int AS declined_offers,
        COALESCE(o.pending_offers, 0)::int AS pending_offers,
        COALESCE(o.expired_offers, 0)::int AS expired_offers,
        COALESCE(o.acceptance_rate, 0.0)::float AS acceptance_rate
      FROM stage_metrics s
      CROSS JOIN time_metrics t
      CROSS JOIN offer_metrics o;
    `;

    const sqlParams = [
      effectiveCompanyId || null,
      jobId || null,
      department || null,
      normalizedStartIso || null,
      normalizedEndIso || null,
    ];

    const result = await query(analyticsSql, sqlParams);
    const row = result.rows[0] || {
      total_applied: 0,
      screened_count: 0,
      interview_count: 0,
      selected_count: 0,
      offered_count: 0,
      hired_count: 0,
      avg_time_to_hire_days: 0.0,
      total_offers: 0,
      accepted_offers: 0,
      declined_offers: 0,
      pending_offers: 0,
      expired_offers: 0,
      acceptance_rate: 0.0,
    };

    const applied = Number(row.total_applied) || 0;
    const screened = Number(row.screened_count) || 0;
    const interviewed = Number(row.interview_count) || 0;
    const selected = Number(row.selected_count) || 0;
    const offered = Number(row.offered_count) || 0;
    const hired = Number(row.hired_count) || 0;

    // Exact conversion rate formulas per specification
    const screeningConversion = applied > 0 ? roundToOneDecimal((screened / applied) * 100) : 0;
    const interviewConversion = screened > 0 ? roundToOneDecimal((interviewed / screened) * 100) : 0;
    const selectionConversion = interviewed > 0 ? roundToOneDecimal((selected / interviewed) * 100) : 0;
    const offerConversion = interviewed > 0 ? roundToOneDecimal((offered / interviewed) * 100) : 0;
    const hiringConversion = offered > 0 ? roundToOneDecimal((hired / offered) * 100) : 0;

    const avgTimeToHireDays = Number(row.avg_time_to_hire_days) || 0.0;
    const offerAcceptanceRate = Number(row.acceptance_rate) || 0.0;

    res.status(200).json({
      success: true,
      data: {
        totalApplications: applied,
        total_applications: applied,
        stageConversion: {
          counts: {
            applied,
            screened,
            interviewed,
            selected,
            offered,
            hired,
          },
          rates: {
            screeningConversion,
            interviewConversion,
            selectionConversion,
            offerConversion,
            hiringConversion,
          },
          // snake_case aliases for client convenience
          screening_conversion: screeningConversion,
          interview_conversion: interviewConversion,
          selection_conversion: selectionConversion,
          offer_conversion: offerConversion,
          hiring_conversion: hiringConversion,
          funnel: [
            { stage: 'APPLIED', count: applied, conversionRate: applied > 0 ? 100 : 0 },
            { stage: 'SCREENING', count: screened, conversionRate: screeningConversion },
            { stage: 'INTERVIEW', count: interviewed, conversionRate: interviewConversion },
            { stage: 'SELECTED', count: selected, conversionRate: selectionConversion },
            { stage: 'OFFERED', count: offered, conversionRate: offerConversion },
            { stage: 'HIRED', count: hired, conversionRate: hiringConversion },
          ],
        },
        averageTimeToHire: avgTimeToHireDays,
        average_time_to_hire_days: avgTimeToHireDays,
        timeToHire: {
          averageDays: avgTimeToHireDays,
          average_days: avgTimeToHireDays,
          hiredCount: hired,
          hired_count: hired,
        },
        offerAcceptanceRate,
        offer_acceptance_rate: offerAcceptanceRate,
        offerMetrics: {
          acceptanceRate: offerAcceptanceRate,
          acceptance_rate: offerAcceptanceRate,
          accepted: Number(row.accepted_offers) || 0,
          declined: Number(row.declined_offers) || 0,
          pending: Number(row.pending_offers) || 0,
          expired: Number(row.expired_offers) || 0,
          total: Number(row.total_offers) || 0,
        },
        filters: {
          jobId: jobId || null,
          department: department || null,
          startDate: rawStartDate || null,
          endDate: rawEndDate || null,
          companyId: effectiveCompanyId || null,
        },
      },
    });
  } catch (error: any) {
    console.error('[AnalyticsController] Error generating summary analytics:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        message: error.message || 'Internal server error while computing hiring analytics',
        statusCode: error.statusCode || 500,
      },
    });
  }
}
