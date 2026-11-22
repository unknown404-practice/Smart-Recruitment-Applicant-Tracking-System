-- ============================================================================
-- Migration 014: Hiring Analytics Functions, UTC Boundaries & Zero-Division Guards
-- Floor 22 Deliverable (Cloud & Database Engineer: Roktima)
-- ============================================================================

-- 1. Performance Indexes for Analytical Funnel & Aggregation Queries
CREATE INDEX IF NOT EXISTS idx_apps_analytics_cohort
ON applications (job_id, applied_at, current_stage, hired_at);

CREATE INDEX IF NOT EXISTS idx_jobs_company_dept
ON jobs (company_id, department, status);

CREATE INDEX IF NOT EXISTS idx_stage_history_analytics
ON application_stage_history (application_id, to_stage, changed_at);

CREATE INDEX IF NOT EXISTS idx_offers_status_analytics
ON offer_records (application_id, status, issued_at, responded_at);

-- 2. PostgreSQL Helper Function: Get Hiring KPI & Funnel Summary
-- Strictly scoped to corporate tenant p_company_id with UTC date truncation and NULLIF guards
CREATE OR REPLACE FUNCTION fn_get_hiring_analytics_summary(
    p_company_id UUID,
    p_job_id UUID DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_total_applications BIGINT := 0;
    v_active_pipeline BIGINT := 0;
    v_hired_count BIGINT := 0;
    v_rejected_count BIGINT := 0;
    v_avg_time_to_hire_days NUMERIC := 0.0;
    v_offer_acceptance_rate NUMERIC := 0.0;
    v_total_offers BIGINT := 0;
    v_accepted_offers BIGINT := 0;
    v_declined_offers BIGINT := 0;
    v_interviews_scheduled BIGINT := 0;
    v_interviews_completed BIGINT := 0;
    v_interview_completion_rate NUMERIC := 0.0;
    v_funnel_stages JSONB;
    v_result JSONB;
BEGIN
    -- Enforce company_id requirement for multi-tenant data isolation
    IF p_company_id IS NULL THEN
        RAISE EXCEPTION 'p_company_id parameter is strictly required for analytics tenant isolation';
    END IF;

    -- Aggregate Core Application Metrics with UTC date truncation & NULLIF guards
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE a.current_stage NOT IN ('HIRED', 'REJECTED')),
        COUNT(*) FILTER (WHERE a.current_stage = 'HIRED'),
        COUNT(*) FILTER (WHERE a.current_stage = 'REJECTED'),
        COALESCE(
            ROUND(
                AVG(
                    EXTRACT(EPOCH FROM (a.hired_at - a.applied_at)) / 86400.0
                ) FILTER (WHERE a.hired_at IS NOT NULL AND a.hired_at >= a.applied_at)::NUMERIC,
                1
            ),
            0.0
        )
    INTO
        v_total_applications,
        v_active_pipeline,
        v_hired_count,
        v_rejected_count,
        v_avg_time_to_hire_days
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE j.company_id = p_company_id
      AND (p_job_id IS NULL OR j.id = p_job_id)
      AND (p_department IS NULL OR j.department = p_department)
      AND (p_start_date IS NULL OR a.applied_at >= (p_start_date AT TIME ZONE 'UTC'))
      AND (p_end_date IS NULL OR a.applied_at <= (p_end_date AT TIME ZONE 'UTC'));

    -- Aggregate Offer Acceptance KPIs with NULLIF zero-division guard
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE o.status = 'ACCEPTED'),
        COUNT(*) FILTER (WHERE o.status = 'DECLINED'),
        COALESCE(
            ROUND(
                (COUNT(*) FILTER (WHERE o.status = 'ACCEPTED')::NUMERIC / 
                 NULLIF(COUNT(*) FILTER (WHERE o.status IN ('ACCEPTED', 'DECLINED')), 0)::NUMERIC) * 100.0,
                1
            ),
            0.0
        )
    INTO
        v_total_offers,
        v_accepted_offers,
        v_declined_offers,
        v_offer_acceptance_rate
    FROM offer_records o
    JOIN applications a ON o.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    WHERE j.company_id = p_company_id
      AND (p_job_id IS NULL OR j.id = p_job_id)
      AND (p_department IS NULL OR j.department = p_department)
      AND (p_start_date IS NULL OR o.created_at >= (p_start_date AT TIME ZONE 'UTC'))
      AND (p_end_date IS NULL OR o.created_at <= (p_end_date AT TIME ZONE 'UTC'));

    -- Aggregate Interview Reliability & Scorecard Completion Metrics
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE ie.status = 'COMPLETED'),
        COALESCE(
            ROUND(
                (COUNT(*) FILTER (WHERE ie.status = 'COMPLETED')::NUMERIC / 
                 NULLIF(COUNT(*), 0)::NUMERIC) * 100.0,
                1
            ),
            0.0
        )
    INTO
        v_interviews_scheduled,
        v_interviews_completed,
        v_interview_completion_rate
    FROM interview_events ie
    JOIN applications a ON ie.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    WHERE j.company_id = p_company_id
      AND (p_job_id IS NULL OR j.id = p_job_id)
      AND (p_department IS NULL OR j.department = p_department)
      AND (p_start_date IS NULL OR ie.scheduled_start >= (p_start_date AT TIME ZONE 'UTC'))
      AND (p_end_date IS NULL OR ie.scheduled_start <= (p_end_date AT TIME ZONE 'UTC'));

    -- Construct Full 6-Stage Recruitment Funnel with relative and absolute conversion rates
    WITH stage_reach AS (
        SELECT
            stage,
            COUNT(DISTINCT a.id) AS candidate_count
        FROM (
            VALUES 
                ('APPLIED'::TEXT, 1),
                ('SCREENING'::TEXT, 2),
                ('INTERVIEW'::TEXT, 3),
                ('SELECTED'::TEXT, 4),
                ('OFFERED'::TEXT, 5),
                ('HIRED'::TEXT, 6)
        ) AS s(stage, step_order)
        LEFT JOIN applications a ON (
            -- Candidate reached this stage either by currently being at/past it, or having a stage history transition to it
            a.current_stage = s.stage
            OR EXISTS (
                SELECT 1 FROM application_stage_history ash 
                WHERE ash.application_id = a.id AND ash.to_stage = s.stage
            )
            OR (s.stage = 'APPLIED') -- All applications start at APPLIED
        )
        JOIN jobs j ON a.job_id = j.id
        WHERE j.company_id = p_company_id
          AND (p_job_id IS NULL OR j.id = p_job_id)
          AND (p_department IS NULL OR j.department = p_department)
          AND (p_start_date IS NULL OR a.applied_at >= (p_start_date AT TIME ZONE 'UTC'))
          AND (p_end_date IS NULL OR a.applied_at <= (p_end_date AT TIME ZONE 'UTC'))
        GROUP BY stage, step_order
        ORDER BY step_order ASC
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'stage', stage,
            'count', candidate_count,
            'conversionFromTotal', COALESCE(
                ROUND((candidate_count::NUMERIC / NULLIF(v_total_applications, 0)::NUMERIC) * 100.0, 1),
                0.0
            )
        )
    )
    INTO v_funnel_stages
    FROM stage_reach;

    -- Return consolidated analytical document
    v_result := jsonb_build_object(
        'companyId', p_company_id,
        'filters', jsonb_build_object(
            'jobId', p_job_id,
            'department', p_department,
            'startDate', p_start_date,
            'endDate', p_end_date
        ),
        'metrics', jsonb_build_object(
            'totalApplications', v_total_applications,
            'activePipeline', v_active_pipeline,
            'hiredCount', v_hired_count,
            'rejectedCount', v_rejected_count,
            'avgTimeToHireDays', v_avg_time_to_hire_days,
            'offerAcceptanceRate', v_offer_acceptance_rate,
            'totalOffers', v_total_offers,
            'acceptedOffers', v_accepted_offers,
            'declinedOffers', v_declined_offers,
            'interviewsScheduled', v_interviews_scheduled,
            'interviewsCompleted', v_interviews_completed,
            'interviewCompletionRate', v_interview_completion_rate
        ),
        'funnel', COALESCE(v_funnel_stages, '[]'::jsonb)
    );

    RETURN v_result;
END;
$$;
