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

describe('Hiring Analytics Engine & Funnel API (/api/analytics) (Floor 22)', () => {
  beforeEach(() => {
    mockVerifyFirebaseIdToken.mockReset();
    mockQuery.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
  });

  const companyAId = '11111111-1111-4111-8111-111111111111';
  const jobId = '22222222-2222-4222-8222-222222222222';

  const adminToken = {
    uid: 'admin-uid-001',
    email: 'admin@company.com',
    role: 'ADMIN',
    companyId: companyAId,
    isActive: true,
  };

  const hrToken = {
    uid: 'hr-uid-001',
    email: 'hr@company.com',
    role: 'HR',
    companyId: companyAId,
    isActive: true,
  };

  const recruiterToken = {
    uid: 'recruiter-uid-001',
    email: 'recruiter@company.com',
    role: 'RECRUITER',
    companyId: companyAId,
    isActive: true,
  };

  const candidateToken = {
    uid: 'candidate-uid-001',
    email: 'candidate@example.com',
    role: 'CANDIDATE',
    companyId: null,
    isActive: true,
  };

  describe('1. Authentication & Role Authorization Guards', () => {
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
    });

    it('rejects HR user with NULL company assignment with 403 Forbidden', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce({
        uid: 'hr-orphan',
        email: 'hr@orphan.com',
        role: 'HR',
        companyId: null,
        isActive: true,
      });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Corporate tenant assignment required');
    });

    it('permits HR, RECRUITER, and ADMIN roles to access summary', async () => {
      // 1. Stored proc returns summary
      const mockSummary = {
        companyId: companyAId,
        filters: { jobId: null, department: null, startDate: null, endDate: null },
        metrics: {
          totalApplications: 10,
          activePipeline: 8,
          hiredCount: 2,
          rejectedCount: 0,
          avgTimeToHireDays: 14.5,
          offerAcceptanceRate: 100.0,
          totalOffers: 2,
          acceptedOffers: 2,
          declinedOffers: 0,
          interviewsScheduled: 5,
          interviewsCompleted: 4,
          interviewCompletionRate: 80.0,
        },
        funnel: [
          { stage: 'APPLIED', count: 10, conversionFromTotal: 100.0 },
          { stage: 'SCREENING', count: 8, conversionFromTotal: 80.0 },
          { stage: 'INTERVIEW', count: 5, conversionFromTotal: 50.0 },
          { stage: 'SELECTED', count: 3, conversionFromTotal: 30.0 },
          { stage: 'OFFERED', count: 2, conversionFromTotal: 20.0 },
          { stage: 'HIRED', count: 2, conversionFromTotal: 20.0 },
        ],
      };

      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrToken);
      mockQuery.mockResolvedValueOnce({ rows: [{ summary: mockSummary }] });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer hr-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalApplications).toBe(10);
      expect(res.body.data.metrics.offerAcceptanceRate).toBe(100.0);
    });
  });

  describe('2. Query Validation & Defensive Input Hardening', () => {
    it('rejects invalid non-UUID jobId with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrToken);

      const res = await request(app)
        .get('/api/analytics/summary?jobId=not-a-valid-uuid')
        .set('Authorization', 'Bearer hr-token');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('must be a valid UUID');
    });

    it('rejects invalid startDate format with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrToken);

      const res = await request(app)
        .get('/api/analytics/summary?startDate=invalid-date')
        .set('Authorization', 'Bearer hr-token');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid startDate format');
    });

    it('rejects request when startDate is after endDate with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrToken);

      const res = await request(app)
        .get('/api/analytics/summary?startDate=2026-12-01&endDate=2026-11-01')
        .set('Authorization', 'Bearer hr-token');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('startDate must not be after endDate');
    });
  });

  describe('3. Zero-Division Safety & Empty Cohort Handling', () => {
    it('gracefully handles empty datasets with zero division protection in fallback mode', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(recruiterToken);

      // Force stored proc rejection to test inline query NULLIF resilience
      mockQuery
        .mockRejectedValueOnce(new Error('fn_get_hiring_analytics_summary does not exist in mock'))
        .mockResolvedValueOnce({
          // appSql: 0 total applications, 0 hires
          rows: [
            {
              total_applications: '0',
              active_pipeline: '0',
              hired_count: '0',
              rejected_count: '0',
              avg_time_to_hire_days: '0.0',
            },
          ],
        })
        .mockResolvedValueOnce({
          // offerSql: 0 offers
          rows: [
            {
              total_offers: '0',
              accepted_offers: '0',
              declined_offers: '0',
              offer_acceptance_rate: '0.0',
            },
          ],
        })
        .mockResolvedValueOnce({
          // intSql: 0 interviews
          rows: [
            {
              interviews_scheduled: '0',
              interviews_completed: '0',
              interview_completion_rate: '0.0',
            },
          ],
        })
        .mockResolvedValueOnce({
          // funnelSql: all 0 counts
          rows: [
            { stage: 'APPLIED', count: '0' },
            { stage: 'SCREENING', count: '0' },
            { stage: 'INTERVIEW', count: '0' },
            { stage: 'SELECTED', count: '0' },
            { stage: 'OFFERED', count: '0' },
            { stage: 'HIRED', count: '0' },
          ],
        });

      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer recruiter-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalApplications).toBe(0);
      expect(res.body.data.metrics.offerAcceptanceRate).toBe(0);
      expect(res.body.data.metrics.interviewCompletionRate).toBe(0);
      expect(res.body.data.metrics.avgTimeToHireDays).toBe(0);
      expect(res.body.data.funnel.length).toBe(6);
      expect(res.body.data.funnel[0].conversionFromTotal).toBe(0);
    });

    it('correctly aggregates populated cohort and step-through conversion rates', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(adminToken);

      mockQuery
        .mockRejectedValueOnce(new Error('fn_get_hiring_analytics_summary does not exist'))
        .mockResolvedValueOnce({
          rows: [
            {
              total_applications: '20',
              active_pipeline: '14',
              hired_count: '4',
              rejected_count: '2',
              avg_time_to_hire_days: '18.4',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              total_offers: '5',
              accepted_offers: '4',
              declined_offers: '1',
              offer_acceptance_rate: '80.0',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              interviews_scheduled: '10',
              interviews_completed: '9',
              interview_completion_rate: '90.0',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { stage: 'APPLIED', count: '20' },
            { stage: 'SCREENING', count: '15' },
            { stage: 'INTERVIEW', count: '10' },
            { stage: 'SELECTED', count: '6' },
            { stage: 'OFFERED', count: '5' },
            { stage: 'HIRED', count: '4' },
          ],
        });

      const res = await request(app)
        .get(`/api/analytics/summary?jobId=${jobId}&department=Engineering`)
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalApplications).toBe(20);
      expect(res.body.data.metrics.offerAcceptanceRate).toBe(80.0);
      expect(res.body.data.metrics.avgTimeToHireDays).toBe(18.4);
      expect(res.body.data.funnel[0].conversionFromTotal).toBe(100.0);
      expect(res.body.data.funnel[1].conversionFromPrevious).toBe(75.0); // 15 / 20 = 75%
      expect(res.body.data.funnel[5].conversionFromTotal).toBe(20.0); // 4 / 20 = 20%
    });
  });

  describe('4. Analytics Filter Facets (/api/analytics/filters)', () => {
    it('returns available departments and jobs for corporate tenant', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrToken);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: jobId,
            title: 'Senior Full Stack Engineer',
            department: 'Engineering',
            status: 'PUBLISHED',
          },
          {
            id: '33333333-3333-4333-8333-333333333333',
            title: 'Product Designer',
            department: 'Design',
            status: 'PUBLISHED',
          },
        ],
      });

      const res = await request(app)
        .get('/api/analytics/filters')
        .set('Authorization', 'Bearer hr-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.departments).toEqual(['Design', 'Engineering']);
      expect(res.body.data.jobs.length).toBe(2);
    });
  });
});
