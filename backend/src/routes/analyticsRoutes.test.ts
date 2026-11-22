const mockVerifyFirebaseIdToken = jest.fn();
const mockQuery = jest.fn();
const mockClientQuery = jest.fn();
const mockClientRelease = jest.fn();

const mockClient = {
  query: mockClientQuery,
  release: mockClientRelease,
};

jest.mock('../config/firebaseAdmin', () => ({
  verifyFirebaseIdToken: (...args: any[]) => mockVerifyFirebaseIdToken(...args),
  setCustomClaims: jest.fn().mockResolvedValue(undefined),
  isAuthEmulatorEnabled: jest.fn().mockReturnValue(true),
  firebaseAdminApp: { name: '[DEFAULT]' },
  adminAuth: {
    getUser: jest.fn(),
    revokeRefreshTokens: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../config/database', () => ({
  pool: {
    query: (...args: any[]) => mockQuery(...args),
    connect: jest.fn().mockImplementation(async () => mockClient),
  },
  query: (...args: any[]) => mockQuery(...args),
  getClient: jest.fn().mockImplementation(async () => mockClient),
  checkDatabaseConnection: jest.fn().mockResolvedValue({ connected: true, latencyMs: 2 }),
  closeDatabasePool: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import app from '../app';

describe('Hiring KPI Analytics API (/api/analytics/summary) (Floor 22)', () => {
  beforeEach(() => {
    mockVerifyFirebaseIdToken.mockReset();
    mockQuery.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
  });

  const companyAId = '11111111-1111-4111-8111-111111111111';
  const companyBId = '22222222-2222-4222-8222-222222222222';
  const jobAId = '33333333-3333-4333-8333-333333333333';
  const jobBId = '44444444-4444-4444-8444-444444444444';

  const hrTokenCompanyA = {
    uid: 'hr-uid-001',
    email: 'hr@company-a.com',
    role: 'HR',
    companyId: companyAId,
    isActive: true,
  };

  const recruiterTokenCompanyA = {
    uid: 'recruiter-uid-001',
    email: 'recruiter@company-a.com',
    role: 'RECRUITER',
    companyId: companyAId,
    isActive: true,
  };

  const adminTokenCompanyA = {
    uid: 'admin-uid-001',
    email: 'admin@company-a.com',
    role: 'ADMIN',
    companyId: companyAId,
    isActive: true,
  };

  const superAdminToken = {
    uid: 'superadmin-uid-001',
    email: 'superadmin@global.com',
    role: 'SUPER_ADMIN',
    companyId: null,
    isActive: true,
  };

  const hrTokenNoCompany = {
    uid: 'hr-orphan-uid',
    email: 'orphan.hr@example.com',
    role: 'HR',
    companyId: null,
    isActive: true,
  };

  const candidateToken = {
    uid: 'candidate-uid-001',
    email: 'candidate@example.com',
    role: 'CANDIDATE',
    isActive: true,
  };

  const mockAnalyticsQueryResult = {
    total_applied: 100,
    screened_count: 50,
    interview_count: 25,
    selected_count: 15,
    offered_count: 10,
    hired_count: 8,
    avg_time_to_hire_days: 18.4,
    total_offers: 12,
    accepted_offers: 8,
    declined_offers: 2,
    pending_offers: 1,
    expired_offers: 1,
    acceptance_rate: 80.0,
  };

  describe('1. Authentication and Role-Based Access Control', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('rejects CANDIDATE role with 403 Forbidden', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(candidateToken);

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-candidate-token');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toMatch(/not permitted to access/i);
    });

    it('rejects staff user without an assigned company in token or DB with 403 Forbidden', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenNoCompany);
      mockQuery.mockResolvedValueOnce({ rows: [] }); // User lookup returns no company

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not associated with an authorized corporate tenant/i);
    });

    it('allows HR staff role to access analytics summary', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalApplications).toBe(100);
    });

    it('allows RECRUITER staff role to access analytics summary', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(recruiterTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-recruiter-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalApplications).toBe(100);
    });

    it('allows ADMIN staff role to access analytics summary', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(adminTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalApplications).toBe(100);
    });

    it('allows SUPER_ADMIN role to access analytics summary globally', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(superAdminToken);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-superadmin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalApplications).toBe(100);
    });
  });

  describe('2. Multi-Tenant Isolation & Boundary Security', () => {
    it('scopes SQL aggregation strictly to the authenticated company', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sqlText, sqlParams] = mockQuery.mock.calls[0];
      expect(sqlText).toContain('j.company_id = $1');
      expect(sqlParams[0]).toBe(companyAId);
    });

    it('forbids Company A staff from overriding companyId with Company B in query parameters (403 Forbidden)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);

      const res = await request(app)
        .get(`/api/analytics/summary?companyId=${companyBId}`)
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/cross-tenant analytics access is strictly prohibited/i);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('allows SUPER_ADMIN to request company-scoped analytics with companyId query parameter', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(superAdminToken);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get(`/api/analytics/summary?companyId=${companyAId}`)
        .set('Authorization', 'Bearer valid-superadmin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const sqlParams = mockQuery.mock.calls[0][1];
      expect(sqlParams[0]).toBe(companyAId);
      expect(res.body.data.filters.companyId).toBe(companyAId);
    });

    it('forbids Company A staff from accessing analytics of a job belonging to Company B (403 Forbidden)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      // Job lookup returns job belonging to Company B
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: jobBId, company_id: companyBId, title: 'Foreign Company Job' }],
      });

      const res = await request(app)
        .get(`/api/analytics/summary?jobId=${jobBId}`)
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/job does not belong to your organization/i);
    });

    it('returns 404 when requested jobId does not exist', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      // Job lookup returns 0 rows
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`/api/analytics/summary?jobId=${jobAId}`)
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/job not found/i);
    });

    it('resolves staff companyId from database if omitted from Firebase token claims', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce({
        uid: 'hr-lazy-claim-uid',
        email: 'hr.lazy@company-a.com',
        role: 'HR',
        companyId: null,
        isActive: true,
      });

      // 1. User DB lookup
      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: companyAId, is_active: true }],
      });
      // 2. Analytics SQL query
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery.mock.calls[1][1][0]).toBe(companyAId);
    });
  });

  describe('3. Query Filter Validation & Boundary Normalization', () => {
    it('rejects malformed non-UUID jobId with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);

      const res = await request(app)
        .get('/api/analytics/summary?jobId=not-a-valid-uuid')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/must be a valid uuid/i);
    });

    it('rejects malformed unparseable startDate with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);

      const res = await request(app)
        .get('/api/analytics/summary?startDate=invalid-date-format')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid startdate format/i);
    });

    it('rejects malformed unparseable endDate with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);

      const res = await request(app)
        .get('/api/analytics/summary?endDate=not-a-date')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid enddate format/i);
    });

    it('1. accepts valid date-only start and date-only end (half-open [start, end))', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary?startDate=2026-11-01&endDate=2026-11-30')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      const sqlParams = mockQuery.mock.calls[0][1];
      expect(sqlParams[3]).toBe('2026-11-01T00:00:00.000Z');
      expect(sqlParams[4]).toBe('2026-12-01T00:00:00.000Z');
    });

    it('2. accepts valid datetime start and datetime end', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary?startDate=2026-11-01T08:00:00.000Z&endDate=2026-11-30T17:00:00.000Z')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      const sqlParams = mockQuery.mock.calls[0][1];
      expect(sqlParams[3]).toBe('2026-11-01T08:00:00.000Z');
      expect(sqlParams[4]).toBe('2026-11-30T17:00:00.000Z');
    });

    it('3. accepts valid date-only start with datetime end', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary?startDate=2026-11-01&endDate=2026-11-01T15:00:00.000Z')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      const sqlParams = mockQuery.mock.calls[0][1];
      expect(sqlParams[3]).toBe('2026-11-01T00:00:00.000Z');
      expect(sqlParams[4]).toBe('2026-11-01T15:00:00.000Z');
    });

    it('4. accepts valid datetime start with date-only end', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary?startDate=2026-11-01T10:00:00.000Z&endDate=2026-11-01')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      const sqlParams = mockQuery.mock.calls[0][1];
      expect(sqlParams[3]).toBe('2026-11-01T10:00:00.000Z');
      expect(sqlParams[4]).toBe('2026-11-02T00:00:00.000Z');
    });

    describe('5. Invalid reversed ranges', () => {
      it('rejects date-only reversed range with 400 Bad Request', async () => {
        mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);

        const res = await request(app)
          .get('/api/analytics/summary?startDate=2026-11-20&endDate=2026-11-10')
          .set('Authorization', 'Bearer valid-hr-token');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toMatch(/startdate must be earlier than enddate/i);
      });

      it('rejects datetime reversed range with 400 Bad Request', async () => {
        mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);

        const res = await request(app)
          .get('/api/analytics/summary?startDate=2026-11-10T15:00:00.000Z&endDate=2026-11-10T12:00:00.000Z')
          .set('Authorization', 'Bearer valid-hr-token');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toMatch(/startdate must be earlier than enddate/i);
      });

      it('rejects date-only start later than datetime end with 400 Bad Request', async () => {
        mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);

        const res = await request(app)
          .get('/api/analytics/summary?startDate=2026-11-02&endDate=2026-11-01T15:00:00.000Z')
          .set('Authorization', 'Bearer valid-hr-token');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toMatch(/startdate must be earlier than enddate/i);
      });

      it('rejects datetime start later than date-only end with 400 Bad Request', async () => {
        mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);

        const res = await request(app)
          .get('/api/analytics/summary?startDate=2026-11-02T10:00:00.000Z&endDate=2026-11-01')
          .set('Authorization', 'Bearer valid-hr-token');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toMatch(/startdate must be earlier than enddate/i);
      });

      it('rejects equal datetime boundary (startInstant >= endInstant) with 400 Bad Request', async () => {
        mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);

        const res = await request(app)
          .get('/api/analytics/summary?startDate=2026-11-10T12:00:00.000Z&endDate=2026-11-10T12:00:00.000Z')
          .set('Authorization', 'Bearer valid-hr-token');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toMatch(/startdate must be earlier than enddate/i);
      });
    });

    it('6. accepts same-day valid date-only range (e.g. 2026-11-15 to 2026-11-15)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary?startDate=2026-11-15&endDate=2026-11-15')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const sqlParams = mockQuery.mock.calls[0][1];
      expect(sqlParams[3]).toBe('2026-11-15T00:00:00.000Z');
      expect(sqlParams[4]).toBe('2026-11-16T00:00:00.000Z');
    });

    it('applies department filter case-insensitively in parameterized query', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary?department=Engineering')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      const sqlParams = mockQuery.mock.calls[0][1];
      expect(sqlParams[2]).toBe('Engineering');
      const sqlText = mockQuery.mock.calls[0][0];
      expect(sqlText).toContain('LOWER(j.department) = LOWER($3)');
    });

    it('applies valid jobId filter after verifying job tenant ownership', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      // 1. Job ownership check
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: jobAId, company_id: companyAId, title: 'Staff Engineer' }],
      });
      // 2. Analytics query
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get(`/api/analytics/summary?jobId=${jobAId}`)
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      const sqlParams = mockQuery.mock.calls[1][1];
      expect(sqlParams[1]).toBe(jobAId);
    });

    it('supports empty filters, querying entire company cohort', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      const sqlParams = mockQuery.mock.calls[0][1];
      expect(sqlParams[0]).toBe(companyAId);
      expect(sqlParams[1]).toBeNull();
      expect(sqlParams[2]).toBeNull();
      expect(sqlParams[3]).toBeNull();
      expect(sqlParams[4]).toBeNull();
    });
  });

  describe('4. Hiring KPI Calculations & Mathematical Correctness', () => {
    it('computes accurate stage conversion rates and time-to-hire', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_applied: 200,
            screened_count: 100, // 100 / 200 = 50%
            interview_count: 50,  // 50 / 100 = 50%
            selected_count: 30,   // 30 / 50 = 60%
            offered_count: 20,    // 20 / 50 = 40% (offered / interviewed)
            hired_count: 15,      // 15 / 20 = 75% (hired / offered)
            avg_time_to_hire_days: 14.5,
            total_offers: 22,
            accepted_offers: 15,
            declined_offers: 5,
            pending_offers: 1,
            expired_offers: 1,
            acceptance_rate: 75.0, // 15 / (15 + 5) * 100 = 75%
          },
        ],
      });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Total Application Volume
      expect(res.body.data.totalApplications).toBe(200);

      // Stage conversion counts
      const counts = res.body.data.stageConversion.counts;
      expect(counts.applied).toBe(200);
      expect(counts.screened).toBe(100);
      expect(counts.interviewed).toBe(50);
      expect(counts.selected).toBe(30);
      expect(counts.offered).toBe(20);
      expect(counts.hired).toBe(15);

      // Stage conversion formulas
      const rates = res.body.data.stageConversion.rates;
      expect(rates.screeningConversion).toBe(50);   // screened / applied × 100
      expect(rates.interviewConversion).toBe(50);   // interviewed / screened × 100
      expect(rates.selectionConversion).toBe(60);   // selected / interviewed × 100
      expect(rates.offerConversion).toBe(40);       // offered / interviewed × 100
      expect(rates.hiringConversion).toBe(75);      // hired / offered × 100

      // Average Time to Hire
      expect(res.body.data.averageTimeToHire).toBe(14.5);
      expect(res.body.data.timeToHire.averageDays).toBe(14.5);
      expect(res.body.data.timeToHire.hiredCount).toBe(15);

      // Offer Acceptance Rate
      expect(res.body.data.offerAcceptanceRate).toBe(75.0);
      expect(res.body.data.offerMetrics.accepted).toBe(15);
      expect(res.body.data.offerMetrics.declined).toBe(5);
      expect(res.body.data.offerMetrics.pending).toBe(1);
      expect(res.body.data.offerMetrics.expired).toBe(1);
      expect(res.body.data.offerMetrics.total).toBe(22);
    });

    it('safely handles empty cohort (zero applications, zero hires, zero offers) without division by zero', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
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
          },
        ],
      });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalApplications).toBe(0);
      expect(res.body.data.averageTimeToHire).toBe(0.0);
      expect(res.body.data.offerAcceptanceRate).toBe(0.0);

      // All conversion rates evaluate safely to 0 instead of NaN or null
      const rates = res.body.data.stageConversion.rates;
      expect(rates.screeningConversion).toBe(0);
      expect(rates.interviewConversion).toBe(0);
      expect(rates.selectionConversion).toBe(0);
      expect(rates.offerConversion).toBe(0);
      expect(rates.hiringConversion).toBe(0);
    });

    it('safely handles zero hires when applications exist (returns 0.0 time-to-hire)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_applied: 50,
            screened_count: 20,
            interview_count: 10,
            selected_count: 5,
            offered_count: 2,
            hired_count: 0, // No one hired yet
            avg_time_to_hire_days: 0.0,
            total_offers: 2,
            accepted_offers: 0,
            declined_offers: 0,
            pending_offers: 2,
            expired_offers: 0,
            acceptance_rate: 0.0, // 0 decided offers
          },
        ],
      });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      expect(res.body.data.totalApplications).toBe(50);
      expect(res.body.data.averageTimeToHire).toBe(0.0);
      expect(res.body.data.timeToHire.hiredCount).toBe(0);
      expect(res.body.data.offerAcceptanceRate).toBe(0.0);
    });

    it('excludes DRAFT offers from total_offers in SQL CTE aggregation', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_applied: 50,
            screened_count: 20,
            interview_count: 15,
            selected_count: 12,
            offered_count: 10,
            hired_count: 8,
            avg_time_to_hire_days: 12.0,
            total_offers: 10, // excludes DRAFT offers
            accepted_offers: 8,
            declined_offers: 2,
            pending_offers: 0,
            expired_offers: 0,
            acceptance_rate: 80.0,
          },
        ],
      });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      const sqlText = mockQuery.mock.calls[0][0];
      // Verifies SQL CTE uses COUNT(CASE WHEN o.status != 'DRAFT' THEN 1 END)::int AS total_offers
      expect(sqlText).toContain("COUNT(CASE WHEN o.status != 'DRAFT' THEN 1 END)::int AS total_offers");
      expect(res.body.data.offerMetrics.total).toBe(10);
      expect(res.body.data.offerMetrics.accepted).toBe(8);
      expect(res.body.data.offerMetrics.declined).toBe(2);
      expect(res.body.data.offerMetrics.acceptanceRate).toBe(80.0);
    });
  });

  describe('5. SQL Injection Defense & Security Hardening', () => {
    it('uses parameterized query parameters and never interpolates user strings', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalyticsQueryResult] });

      const maliciousDepartment = "Engineering'; DROP TABLE applications; --";

      const res = await request(app)
        .get(`/api/analytics/summary?department=${encodeURIComponent(maliciousDepartment)}`)
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      const [sqlText, sqlParams] = mockQuery.mock.calls[0];
      // SQL text should contain parameter placeholder $3, not the malicious payload
      expect(sqlText).not.toContain('DROP TABLE');
      expect(sqlText).toContain('LOWER(j.department) = LOWER($3)');
      expect(sqlParams[2]).toBe(maliciousDepartment);
    });
  });
});
