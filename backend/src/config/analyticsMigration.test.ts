import fs from 'fs';
import path from 'path';

describe('Database Migration 014: Hiring Analytics Functions & Zero-Division Guards (Floor 22)', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../../../database/migrations/014_hiring_analytics_functions.sql'
  );

  it('1. Migration file 014 must exist on disk', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('2. Configures composite indexes for analytics performance', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_apps_analytics_cohort');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_jobs_company_dept');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_stage_history_analytics');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_offers_company_status_analytics');
  });

  it('3. Defines PostgreSQL helper function fn_get_hiring_analytics_summary', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('CREATE OR REPLACE FUNCTION fn_get_hiring_analytics_summary(');
    expect(content).toContain('p_company_id UUID');
    expect(content).toContain('p_job_id UUID DEFAULT NULL');
    expect(content).toContain('p_department TEXT DEFAULT NULL');
    expect(content).toContain('p_start_date TIMESTAMPTZ DEFAULT NULL');
    expect(content).toContain('p_end_date TIMESTAMPTZ DEFAULT NULL');
    expect(content).toContain('RETURNS JSONB');
  });

  it('4. Enforces UTC date boundary normalization and zero-division guards', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain("AT TIME ZONE 'UTC'");
    expect(content).toContain('NULLIF(');
    expect(content).toContain('p_company_id IS NULL');
  });
});
