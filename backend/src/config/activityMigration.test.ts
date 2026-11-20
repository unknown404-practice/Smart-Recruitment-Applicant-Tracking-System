import fs from 'fs';
import path from 'path';

describe('Database Migration 013: Unified System Activity Log View & Performance Indexes (Floor 20)', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../../../database/migrations/013_unified_activity_log.sql'
  );

  it('1. Migration file 013 must exist on disk', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('2. Configures composite indexes for activity timeline aggregation', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_stage_history_composite_timeline');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_interview_audit_composite_timeline');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_offer_records_activity_composite');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_notification_events_activity_composite');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_activity_composite');
  });

  it('3. Defines unified view v_system_activity_feed aggregating cross-workflow tables', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('CREATE OR REPLACE VIEW v_system_activity_feed AS');
    expect(content).toContain("'STAGE_TRANSITION'::VARCHAR(50) AS activity_type");
    expect(content).toContain("'INTERVIEW_EVENT'::VARCHAR(50) AS activity_type");
    expect(content).toContain("'OFFER_EVENT'::VARCHAR(50) AS activity_type");
    expect(content).toContain("'NOTIFICATION_DISPATCH'::VARCHAR(50) AS activity_type");
    expect(content).toContain("'ONBOARDING_UPDATE'::VARCHAR(50) AS activity_type");
  });

  it('4. Provides parameterized SQL helper fn_query_system_activity for tenant-isolated lookups', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('CREATE OR REPLACE FUNCTION fn_query_system_activity(');
    expect(content).toContain('p_company_id UUID DEFAULT NULL');
    expect(content).toContain('p_candidate_id UUID DEFAULT NULL');
    expect(content).toContain('p_application_id UUID DEFAULT NULL');
    expect(content).toContain('p_activity_type VARCHAR DEFAULT NULL');
    expect(content).toContain('ORDER BY v.created_at DESC');
  });
});
