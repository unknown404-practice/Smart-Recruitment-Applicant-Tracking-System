import fs from 'fs';
import path from 'path';

describe('Database Migration 012: Onboarding Tasks & Offer Acceptance Schema Enhancements (Floor 19)', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../../../database/migrations/012_onboarding_tasks.sql'
  );

  it('1. Migration file 012 must exist on disk', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('2. Extends application_stage enum to include HIRED terminal state', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain("ALTER TYPE application_stage ADD VALUE IF NOT EXISTS 'HIRED'");
  });

  it('3. Adds hired_at audit timestamp column to applications table', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('ALTER TABLE applications');
    expect(content).toContain('ADD COLUMN IF NOT EXISTS hired_at TIMESTAMPTZ');
  });

  it('4. Enhances onboarding_tasks table with application_id and category taxonomy', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS onboarding_tasks');
    expect(content).toContain('candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE');
    expect(content).toContain('offer_id UUID REFERENCES offer_records(id) ON DELETE CASCADE');
    expect(content).toContain('application_id UUID REFERENCES applications(id) ON DELETE CASCADE');
    expect(content).toContain("category VARCHAR(100) NOT NULL DEFAULT 'GENERAL'");
    expect(content).toContain('is_completed BOOLEAN NOT NULL DEFAULT FALSE');
    expect(content).toContain('due_date DATE');
    expect(content).toContain('completed_at TIMESTAMPTZ');
  });

  it('5. Configures high-performance query & candidate ownership indexes', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_candidate_id');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_offer_id');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_application_id');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_category');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_completion');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_applications_hired_at');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_applications_candidate_stage');
  });
});
