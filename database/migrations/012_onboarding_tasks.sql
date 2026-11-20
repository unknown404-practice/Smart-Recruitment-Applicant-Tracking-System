-- ============================================================================
-- Migration 012: Onboarding Tasks & Offer Acceptance Schema Enhancements
-- Floor 19 Deliverable (Cloud & Database Engineer: Roktima)
-- 
-- 1. Extends application_stage enum to include 'HIRED' terminal state
-- 2. Adds hired_at audit timestamp to applications table
-- 3. Enhances onboarding_tasks table with application_id link and category taxonomy
-- 4. Creates performance indexes for onboarding task tracking and candidate ownership
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extend application_stage enum to include HIRED
-- ----------------------------------------------------------------------------
ALTER TYPE application_stage ADD VALUE IF NOT EXISTS 'HIRED';

-- ----------------------------------------------------------------------------
-- 2. Add hired_at timestamp to applications table
-- ----------------------------------------------------------------------------
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS hired_at TIMESTAMPTZ;

-- ----------------------------------------------------------------------------
-- 3. Enhance onboarding_tasks table schema
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offer_records(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'GENERAL',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE onboarding_tasks
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id) ON DELETE CASCADE;

ALTER TABLE onboarding_tasks
ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'GENERAL';

DROP TRIGGER IF EXISTS set_onboarding_tasks_updated_at ON onboarding_tasks;
CREATE TRIGGER set_onboarding_tasks_updated_at
    BEFORE UPDATE ON onboarding_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. High-Performance Query & Candidate Ownership Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_candidate_id ON onboarding_tasks(candidate_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_offer_id ON onboarding_tasks(offer_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_application_id ON onboarding_tasks(application_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_category ON onboarding_tasks(category);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_completion ON onboarding_tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_applications_hired_at ON applications(hired_at) WHERE hired_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_applications_candidate_stage ON applications(candidate_id, current_stage);
