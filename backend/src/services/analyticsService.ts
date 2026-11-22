import { pool } from '../config/database';

export interface AnalyticsFilterParams {
  companyId: string;
  jobId?: string | null;
  department?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface FunnelStage {
  stage: string;
  count: number;
  conversionFromTotal: number;
  conversionFromPrevious?: number;
}

export interface AnalyticsSummaryResult {
  companyId: string;
  filters: {
    jobId: string | null;
    department: string | null;
    startDate: string | null;
    endDate: string | null;
  };
  metrics: {
    totalApplications: number;
    activePipeline: number;
    hiredCount: number;
    rejectedCount: number;
    avgTimeToHireDays: number;
    offerAcceptanceRate: number;
    totalOffers: number;
    acceptedOffers: number;
    declinedOffers: number;
    interviewsScheduled: number;
    interviewsCompleted: number;
    interviewCompletionRate: number;
  };
  funnel: FunnelStage[];
}

export class AnalyticsService {
  /**
   * Retrieves aggregated hiring KPI metrics and recruitment funnel.
   * Utilizes PostgreSQL fn_get_hiring_analytics_summary or optimized fallback aggregation.
   */
  public static async getHiringAnalyticsSummary(
    filters: AnalyticsFilterParams
  ): Promise<AnalyticsSummaryResult> {
    const { companyId, jobId = null, department = null, startDate = null, endDate = null } = filters;

    try {
      // First attempt using the high-performance PostgreSQL stored procedure
      const res = await pool.query(
        'SELECT fn_get_hiring_analytics_summary($1, $2, $3, $4, $5) AS summary;',
        [companyId, jobId, department, startDate, endDate]
      );

      if (res.rows && res.rows[0] && res.rows[0].summary) {
        const rawSummary = res.rows[0].summary;
        return this.normalizeAnalyticsSummary(rawSummary);
      }
    } catch (spErr: any) {
      // Fallback to inline parameterized SQL query (essential for mock test suites and fresh pools)
      return this.computeInlineAnalytics(filters);
    }

    return this.computeInlineAnalytics(filters);
  }

  /**
   * Retrieves available filter options (distinct departments and active jobs) for a company.
   */
  public static async getFilterOptions(companyId: string) {
    const jobsQuery = `
      SELECT id, title, department, status
      FROM jobs
      WHERE company_id = $1
      ORDER BY title ASC;
    `;
    const { rows: jobs } = await pool.query(jobsQuery, [companyId]);

    const departments = Array.from(
      new Set(jobs.map((j) => j.department).filter(Boolean))
    ).sort();

    return {
      departments,
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        department: j.department,
        status: j.status,
      })),
    };
  }

  /**
   * Inline parameterized SQL engine computing KPIs with UTC date boundary normalization and NULLIF zero-division guards.
   */
  private static async computeInlineAnalytics(
    filters: AnalyticsFilterParams
  ): Promise<AnalyticsSummaryResult> {
    const { companyId, jobId = null, department = null, startDate = null, endDate = null } = filters;

    // 1. Applications query
    const appParams: any[] = [companyId];
    let appWhere = 'WHERE j.company_id = $1';

    if (jobId) {
      appParams.push(jobId);
      appWhere += ` AND j.id = $${appParams.length}`;
    }
    if (department) {
      appParams.push(department);
      appWhere += ` AND j.department = $${appParams.length}`;
    }
    if (startDate) {
      appParams.push(startDate);
      appWhere += ` AND a.applied_at >= ($${appParams.length}::timestamptz AT TIME ZONE 'UTC')`;
    }
    if (endDate) {
      appParams.push(endDate);
      appWhere += ` AND a.applied_at <= ($${appParams.length}::timestamptz AT TIME ZONE 'UTC')`;
    }

    const appSql = `
      SELECT
        COUNT(*)::bigint AS total_applications,
        COUNT(*) FILTER (WHERE a.current_stage NOT IN ('HIRED', 'REJECTED'))::bigint AS active_pipeline,
        COUNT(*) FILTER (WHERE a.current_stage = 'HIRED')::bigint AS hired_count,
        COUNT(*) FILTER (WHERE a.current_stage = 'REJECTED')::bigint AS rejected_count,
        COALESCE(
          ROUND(
            AVG(EXTRACT(EPOCH FROM (a.hired_at - a.applied_at)) / 86400.0)
            FILTER (WHERE a.hired_at IS NOT NULL AND a.hired_at >= a.applied_at)::numeric,
            1
          ),
          0.0
        ) AS avg_time_to_hire_days
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      ${appWhere};
    `;
    const appRes = await pool.query(appSql, appParams);
    const appRow = appRes.rows[0] || {};

    // 2. Offer Acceptance query
    const offerParams: any[] = [companyId];
    let offerWhere = 'WHERE j.company_id = $1';
    if (jobId) {
      offerParams.push(jobId);
      offerWhere += ` AND j.id = $${offerParams.length}`;
    }
    if (department) {
      offerParams.push(department);
      offerWhere += ` AND j.department = $${offerParams.length}`;
    }
    if (startDate) {
      offerParams.push(startDate);
      offerWhere += ` AND o.created_at >= ($${offerParams.length}::timestamptz AT TIME ZONE 'UTC')`;
    }
    if (endDate) {
      offerParams.push(endDate);
      offerWhere += ` AND o.created_at <= ($${offerParams.length}::timestamptz AT TIME ZONE 'UTC')`;
    }

    const offerSql = `
      SELECT
        COUNT(*)::bigint AS total_offers,
        COUNT(*) FILTER (WHERE o.status = 'ACCEPTED')::bigint AS accepted_offers,
        COUNT(*) FILTER (WHERE o.status = 'DECLINED')::bigint AS declined_offers,
        COALESCE(
          ROUND(
            (COUNT(*) FILTER (WHERE o.status = 'ACCEPTED')::numeric /
             NULLIF(COUNT(*) FILTER (WHERE o.status IN ('ACCEPTED', 'DECLINED')), 0)::numeric) * 100.0,
            1
          ),
          0.0
        ) AS offer_acceptance_rate
      FROM offer_records o
      JOIN applications a ON o.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      ${offerWhere};
    `;
    const offerRes = await pool.query(offerSql, offerParams);
    const offerRow = offerRes.rows[0] || {};

    // 3. Interview Reliability query
    const intParams: any[] = [companyId];
    let intWhere = 'WHERE j.company_id = $1';
    if (jobId) {
      intParams.push(jobId);
      intWhere += ` AND j.id = $${intParams.length}`;
    }
    if (department) {
      intParams.push(department);
      intWhere += ` AND j.department = $${intParams.length}`;
    }
    if (startDate) {
      intParams.push(startDate);
      intWhere += ` AND ie.scheduled_start >= ($${intParams.length}::timestamptz AT TIME ZONE 'UTC')`;
    }
    if (endDate) {
      intParams.push(endDate);
      intWhere += ` AND ie.scheduled_start <= ($${intParams.length}::timestamptz AT TIME ZONE 'UTC')`;
    }

    const intSql = `
      SELECT
        COUNT(*)::bigint AS interviews_scheduled,
        COUNT(*) FILTER (WHERE ie.status = 'COMPLETED')::bigint AS interviews_completed,
        COALESCE(
          ROUND(
            (COUNT(*) FILTER (WHERE ie.status = 'COMPLETED')::numeric /
             NULLIF(COUNT(*), 0)::numeric) * 100.0,
            1
          ),
          0.0
        ) AS interview_completion_rate
      FROM interview_events ie
      JOIN applications a ON ie.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      ${intWhere};
    `;
    const intRes = await pool.query(intSql, intParams);
    const intRow = intRes.rows[0] || {};

    // 4. Funnel stage queries
    const totalApps = Number(appRow.total_applications || 0);

    const funnelSql = `
      WITH filtered_apps AS (
        SELECT a.id, a.current_stage
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        ${appWhere}
      )
      SELECT
        s.stage,
        COUNT(DISTINCT fa.id)::bigint AS count
      FROM (
        VALUES 
          ('APPLIED'::text, 1),
          ('SCREENING'::text, 2),
          ('INTERVIEW'::text, 3),
          ('SELECTED'::text, 4),
          ('OFFERED'::text, 5),
          ('HIRED'::text, 6)
      ) AS s(stage, step_order)
      LEFT JOIN filtered_apps fa ON (
        fa.current_stage = s.stage
        OR EXISTS (
          SELECT 1 FROM application_stage_history ash 
          WHERE ash.application_id = fa.id AND ash.to_stage = s.stage
        )
        OR (s.stage = 'APPLIED')
      )
      GROUP BY s.stage, s.step_order
      ORDER BY s.step_order ASC;
    `;
    const funnelRes = await pool.query(funnelSql, appParams);

    const funnel: FunnelStage[] = (funnelRes.rows || []).map((row: any, idx: number, arr: any[]) => {
      const count = Number(row.count || 0);
      const conversionFromTotal = totalApps > 0 ? Number(((count / totalApps) * 100).toFixed(1)) : 0.0;
      const prevCount = idx > 0 ? Number(arr[idx - 1].count || 0) : count;
      const conversionFromPrevious = prevCount > 0 ? Number(((count / prevCount) * 100).toFixed(1)) : 0.0;

      return {
        stage: row.stage,
        count,
        conversionFromTotal,
        conversionFromPrevious: idx === 0 ? 100.0 : conversionFromPrevious,
      };
    });

    return {
      companyId,
      filters: { jobId, department, startDate, endDate },
      metrics: {
        totalApplications: totalApps,
        activePipeline: Number(appRow.active_pipeline || 0),
        hiredCount: Number(appRow.hired_count || 0),
        rejectedCount: Number(appRow.rejected_count || 0),
        avgTimeToHireDays: Number(appRow.avg_time_to_hire_days || 0.0),
        offerAcceptanceRate: Number(offerRow.offer_acceptance_rate || 0.0),
        totalOffers: Number(offerRow.total_offers || 0),
        acceptedOffers: Number(offerRow.accepted_offers || 0),
        declinedOffers: Number(offerRow.declined_offers || 0),
        interviewsScheduled: Number(intRow.interviews_scheduled || 0),
        interviewsCompleted: Number(intRow.interviews_completed || 0),
        interviewCompletionRate: Number(intRow.interview_completion_rate || 0.0),
      },
      funnel,
    };
  }

  private static normalizeAnalyticsSummary(raw: any): AnalyticsSummaryResult {
    const totalApps = Number(raw.metrics?.totalApplications || 0);
    const rawFunnel: any[] = Array.isArray(raw.funnel) ? raw.funnel : [];

    const funnel: FunnelStage[] = rawFunnel.map((item, idx, arr) => {
      const count = Number(item.count || 0);
      const conversionFromTotal = totalApps > 0 ? Number(((count / totalApps) * 100).toFixed(1)) : 0.0;
      const prevCount = idx > 0 ? Number(arr[idx - 1].count || 0) : count;
      const conversionFromPrevious = prevCount > 0 ? Number(((count / prevCount) * 100).toFixed(1)) : 0.0;

      return {
        stage: item.stage,
        count,
        conversionFromTotal,
        conversionFromPrevious: idx === 0 ? 100.0 : conversionFromPrevious,
      };
    });

    return {
      companyId: raw.companyId,
      filters: {
        jobId: raw.filters?.jobId || null,
        department: raw.filters?.department || null,
        startDate: raw.filters?.startDate || null,
        endDate: raw.filters?.endDate || null,
      },
      metrics: {
        totalApplications: totalApps,
        activePipeline: Number(raw.metrics?.activePipeline || 0),
        hiredCount: Number(raw.metrics?.hiredCount || 0),
        rejectedCount: Number(raw.metrics?.rejectedCount || 0),
        avgTimeToHireDays: Number(raw.metrics?.avgTimeToHireDays || 0.0),
        offerAcceptanceRate: Number(raw.metrics?.offerAcceptanceRate || 0.0),
        totalOffers: Number(raw.metrics?.totalOffers || 0),
        acceptedOffers: Number(raw.metrics?.acceptedOffers || 0),
        declinedOffers: Number(raw.metrics?.declinedOffers || 0),
        interviewsScheduled: Number(raw.metrics?.interviewsScheduled || 0),
        interviewsCompleted: Number(raw.metrics?.interviewsCompleted || 0),
        interviewCompletionRate: Number(raw.metrics?.interviewCompletionRate || 0.0),
      },
      funnel,
    };
  }
}
