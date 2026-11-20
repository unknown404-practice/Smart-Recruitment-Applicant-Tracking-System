-- ============================================================================
-- Migration 013: Unified System Activity Log View & Performance Indexes
-- Floor 20 Deliverable (Cloud & Database Engineer: Roktima)
-- 
-- 1. Creates high-performance composite indexes across audit & event tables
-- 2. Defines unified view v_system_activity_feed aggregating:
--    - application_stage_history (Stage transitions)
--    - interview_audit_log (Interview schedules, reschedules, feedback scorecards)
--    - offer_records (Offer creation, issuance, candidate accept/decline)
--    - notification_events (System email & in-app dispatches)
--    - onboarding_tasks (Onboarding checklist task completions)
-- 3. Provides parameterized SQL helper fn_query_system_activity for tenant-isolated feeds
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. High-Performance Composite Indexes for Activity Feed Aggregation
-- ----------------------------------------------------------------------------

-- Stage history timeline and application linkage
CREATE INDEX IF NOT EXISTS idx_stage_history_composite_timeline 
ON application_stage_history (changed_at DESC, application_id, changed_by);

-- Interview audit log timeline and actor resolution
CREATE INDEX IF NOT EXISTS idx_interview_audit_composite_timeline 
ON interview_audit_log (created_at DESC, interview_id, actor_id);

-- Offer records timeline and application status lookup
CREATE INDEX IF NOT EXISTS idx_offer_records_activity_composite 
ON offer_records (updated_at DESC, application_id, status);

-- Notification delivery timeline and recipient lookup
CREATE INDEX IF NOT EXISTS idx_notification_events_activity_composite 
ON notification_events (created_at DESC, recipient_user_id, status);

-- Onboarding tasks completion activity
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_activity_composite 
ON onboarding_tasks (updated_at DESC, candidate_id, is_completed);

-- ----------------------------------------------------------------------------
-- 2. Unified System Activity Feed View (v_system_activity_feed)
-- Aggregates all cross-workflow events into a normalized audit stream
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_system_activity_feed AS

-- A. Application Stage Transitions
SELECT
    ash.id AS id,
    'STAGE_TRANSITION'::VARCHAR(50) AS activity_type,
    'APPLICATION'::VARCHAR(50) AS entity_type,
    ash.application_id AS entity_id,
    j.company_id AS company_id,
    ash.changed_by AS actor_id,
    COALESCE(u_actor.full_name, 'System') AS actor_name,
    COALESCE(u_actor.email, 'system@smartats.com') AS actor_email,
    COALESCE(u_actor.role::VARCHAR, 'SYSTEM') AS actor_role,
    cp.id AS candidate_id,
    COALESCE(u_cand.full_name, 'Candidate') AS candidate_name,
    u_cand.email AS candidate_email,
    a.job_id AS job_id,
    j.title AS job_title,
    a.id AS application_id,
    COALESCE(ash.from_stage::VARCHAR || ' -> ' || ash.to_stage::VARCHAR, ash.to_stage::VARCHAR) AS action,
    'Stage Changed to ' || ash.to_stage::VARCHAR AS title,
    COALESCE(ash.reason, 'Candidate advanced to ' || ash.to_stage::VARCHAR) AS description,
    jsonb_build_object(
        'from_stage', ash.from_stage,
        'to_stage', ash.to_stage,
        'department', j.department
    ) AS metadata,
    ash.changed_at AS created_at
FROM application_stage_history ash
JOIN applications a ON ash.application_id = a.id
JOIN jobs j ON a.job_id = j.id
JOIN candidate_profiles cp ON a.candidate_id = cp.id
JOIN users u_cand ON cp.user_id = u_cand.id
LEFT JOIN users u_actor ON ash.changed_by = u_actor.id

UNION ALL

-- B. Interview Lifecycle & Scorecard Events
SELECT
    ial.id AS id,
    'INTERVIEW_EVENT'::VARCHAR(50) AS activity_type,
    'INTERVIEW'::VARCHAR(50) AS entity_type,
    ial.interview_id AS entity_id,
    j.company_id AS company_id,
    ial.actor_id AS actor_id,
    COALESCE(u_actor.full_name, 'Interviewer') AS actor_name,
    COALESCE(u_actor.email, 'interviewer@smartats.com') AS actor_email,
    COALESCE(u_actor.role::VARCHAR, 'HR') AS actor_role,
    cp.id AS candidate_id,
    COALESCE(u_cand.full_name, 'Candidate') AS candidate_name,
    u_cand.email AS candidate_email,
    a.job_id AS job_id,
    j.title AS job_title,
    a.id AS application_id,
    ial.action AS action,
    CASE ial.action
        WHEN 'SCHEDULED' THEN 'Interview Scheduled'
        WHEN 'RESCHEDULED' THEN 'Interview Rescheduled'
        WHEN 'CANCELLED' THEN 'Interview Cancelled'
        WHEN 'SCORECARD_SUBMITTED' THEN 'Evaluation Scorecard Submitted'
        WHEN 'COMPLETED' THEN 'Interview Completed'
        ELSE 'Interview Updated'
    END AS title,
    COALESCE(ial.reason, 'Interview event recorded') AS description,
    jsonb_build_object(
        'action', ial.action,
        'previous_start', ial.previous_start,
        'new_start', ial.new_start,
        'previous_end', ial.previous_end,
        'new_end', ial.new_end,
        'event_metadata', ial.metadata
    ) AS metadata,
    ial.created_at AS created_at
FROM interview_audit_log ial
JOIN interview_events ie ON ial.interview_id = ie.id
JOIN applications a ON ie.application_id = a.id
JOIN jobs j ON a.job_id = j.id
JOIN candidate_profiles cp ON a.candidate_id = cp.id
JOIN users u_cand ON cp.user_id = u_cand.id
LEFT JOIN users u_actor ON ial.actor_id = u_actor.id

UNION ALL

-- C. Offer Letter Generation, Issuance & Candidate Responses
SELECT
    o.id AS id,
    'OFFER_EVENT'::VARCHAR(50) AS activity_type,
    'OFFER'::VARCHAR(50) AS entity_type,
    o.id AS entity_id,
    j.company_id AS company_id,
    o.created_by AS actor_id,
    COALESCE(u_actor.full_name, 'HR Manager') AS actor_name,
    COALESCE(u_actor.email, 'hr@smartats.com') AS actor_email,
    COALESCE(u_actor.role::VARCHAR, 'HR') AS actor_role,
    cp.id AS candidate_id,
    COALESCE(u_cand.full_name, 'Candidate') AS candidate_name,
    u_cand.email AS candidate_email,
    a.job_id AS job_id,
    j.title AS job_title,
    a.id AS application_id,
    o.status::VARCHAR AS action,
    CASE o.status
        WHEN 'DRAFT' THEN 'Draft Offer Prepared'
        WHEN 'ISSUED' THEN 'Offer Letter Issued'
        WHEN 'ACCEPTED' THEN 'Candidate Accepted Offer'
        WHEN 'DECLINED' THEN 'Candidate Declined Offer'
        WHEN 'EXPIRED' THEN 'Offer Expired'
        ELSE 'Offer Updated'
    END AS title,
    'Offer for ' || j.title || ' (' || o.currency || ' ' || o.salary_amount::TEXT || ')' AS description,
    jsonb_build_object(
        'salary_amount', o.salary_amount,
        'currency', o.currency,
        'status', o.status,
        'start_date', o.start_date,
        'issued_at', o.issued_at,
        'responded_at', o.responded_at
    ) AS metadata,
    COALESCE(o.responded_at, o.issued_at, o.updated_at, o.created_at) AS created_at
FROM offer_records o
JOIN applications a ON o.application_id = a.id
JOIN jobs j ON a.job_id = j.id
JOIN candidate_profiles cp ON a.candidate_id = cp.id
JOIN users u_cand ON cp.user_id = u_cand.id
LEFT JOIN users u_actor ON o.created_by = u_actor.id

UNION ALL

-- D. Transactional Notification Dispatches
SELECT
    ne.id AS id,
    'NOTIFICATION_DISPATCH'::VARCHAR(50) AS activity_type,
    'NOTIFICATION'::VARCHAR(50) AS entity_type,
    ne.id AS entity_id,
    u_recip.company_id AS company_id,
    NULL::UUID AS actor_id,
    'System Dispatcher' AS actor_name,
    'system@smartats.com' AS actor_email,
    'SYSTEM' AS actor_role,
    cp.id AS candidate_id,
    u_recip.full_name AS candidate_name,
    u_recip.email AS candidate_email,
    NULL::UUID AS job_id,
    NULL::VARCHAR(255) AS job_title,
    NULL::UUID AS application_id,
    ne.event_type AS action,
    ne.subject AS title,
    'Notification delivered via ' || ne.channel::VARCHAR || ' (' || ne.status::VARCHAR || ')' AS description,
    jsonb_build_object(
        'channel', ne.channel,
        'status', ne.status,
        'event_type', ne.event_type,
        'retry_count', ne.retry_count,
        'metadata', ne.metadata
    ) AS metadata,
    ne.created_at AS created_at
FROM notification_events ne
JOIN users u_recip ON ne.recipient_user_id = u_recip.id
LEFT JOIN candidate_profiles cp ON cp.user_id = u_recip.id

UNION ALL

-- E. Onboarding Task Checklists
SELECT
    ot.id AS id,
    'ONBOARDING_UPDATE'::VARCHAR(50) AS activity_type,
    'ONBOARDING'::VARCHAR(50) AS entity_type,
    ot.id AS entity_id,
    j.company_id AS company_id,
    u_cand.id AS actor_id,
    u_cand.full_name AS actor_name,
    u_cand.email AS actor_email,
    'CANDIDATE' AS actor_role,
    cp.id AS candidate_id,
    u_cand.full_name AS candidate_name,
    u_cand.email AS candidate_email,
    a.job_id AS job_id,
    j.title AS job_title,
    a.id AS application_id,
    CASE WHEN ot.is_completed THEN 'TASK_COMPLETED' ELSE 'TASK_ASSIGNED' END AS action,
    'Onboarding Task: ' || ot.title AS title,
    CASE WHEN ot.is_completed THEN 'Completed by candidate' ELSE 'Pending completion' END AS description,
    jsonb_build_object(
        'task_id', ot.id,
        'category', ot.category,
        'is_completed', ot.is_completed,
        'due_date', ot.due_date,
        'completed_at', ot.completed_at
    ) AS metadata,
    COALESCE(ot.completed_at, ot.updated_at, ot.created_at) AS created_at
FROM onboarding_tasks ot
JOIN candidate_profiles cp ON ot.candidate_id = cp.id
JOIN users u_cand ON cp.user_id = u_cand.id
LEFT JOIN applications a ON ot.application_id = a.id
LEFT JOIN jobs j ON a.job_id = j.id;

-- ----------------------------------------------------------------------------
-- 3. SQL Helper: Parameterized Tenant-Isolated Activity Lookup Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_query_system_activity(
    p_company_id UUID DEFAULT NULL,
    p_candidate_id UUID DEFAULT NULL,
    p_application_id UUID DEFAULT NULL,
    p_activity_type VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    activity_type VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id UUID,
    company_id UUID,
    actor_id UUID,
    actor_name VARCHAR,
    actor_email VARCHAR,
    actor_role VARCHAR,
    candidate_id UUID,
    candidate_name VARCHAR,
    candidate_email VARCHAR,
    job_id UUID,
    job_title VARCHAR,
    application_id UUID,
    action VARCHAR,
    title TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT v.*
    FROM v_system_activity_feed v
    WHERE (p_company_id IS NULL OR v.company_id = p_company_id)
      AND (p_candidate_id IS NULL OR v.candidate_id = p_candidate_id)
      AND (p_application_id IS NULL OR v.application_id = p_application_id)
      AND (p_activity_type IS NULL OR v.activity_type = p_activity_type)
    ORDER BY v.created_at DESC
    LIMIT LEAST(p_limit, 100)
    OFFSET GREATEST(p_offset, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
