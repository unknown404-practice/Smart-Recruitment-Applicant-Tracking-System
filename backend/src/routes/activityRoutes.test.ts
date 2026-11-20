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

describe('Unified System Activity Log API (/api/activity) (Floor 20)', () => {
  beforeEach(() => {
    mockVerifyFirebaseIdToken.mockReset();
    mockQuery.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
  });

  const companyAId = '11111111-1111-4111-8111-111111111111';
  const companyBId = '22222222-2222-4222-8222-222222222222';
  const candidateId = '33333333-3333-4333-8333-333333333333';
  const applicationId = '44444444-4444-4444-8444-444444444444';

  const adminToken = {
    uid: 'admin-uid-001',
    email: 'admin@techcorp.com',
    role: 'ADMIN',
    companyId: companyAId,
    isActive: true,
  };

  const hrTokenCompanyA = {
    uid: 'hr-uid-001',
    email: 'hr@techcorp.com',
    role: 'HR',
    companyId: companyAId,
    isActive: true,
  };

  const hrTokenNoCompany = {
    uid: 'hr-uid-null-corp',
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

  const sampleActivities = [
    {
      id: '55555555-5555-4555-8555-555555555551',
      activity_type: 'STAGE_TRANSITION',
      entity_type: 'APPLICATION',
      entity_id: applicationId,
      company_id: companyAId,
      actor_id: hrTokenCompanyA.uid,
      actor_name: 'HR Recruiter',
      actor_email: hrTokenCompanyA.email,
      actor_role: 'HR',
      candidate_id: candidateId,
      candidate_name: 'Alex Morgan',
      candidate_email: 'alex.morgan@test.com',
      job_id: '66666666-6666-4666-8666-666666666666',
      job_title: 'Senior Backend Engineer',
      application_id: applicationId,
      action: 'APPLIED -> SCREENING',
      title: 'Stage Changed to SCREENING',
      description: 'Candidate met initial minimum requirements',
      metadata: { from_stage: 'APPLIED', to_stage: 'SCREENING' },
      created_at: new Date('2026-11-20T10:00:00Z'),
    },
    {
      id: '55555555-5555-4555-8555-555555555552',
      activity_type: 'OFFER_EVENT',
      entity_type: 'OFFER',
      entity_id: '77777777-7777-4777-8777-777777777777',
      company_id: companyAId,
      actor_id: hrTokenCompanyA.uid,
      actor_name: 'HR Recruiter',
      actor_email: hrTokenCompanyA.email,
      actor_role: 'HR',
      candidate_id: candidateId,
      candidate_name: 'Alex Morgan',
      candidate_email: 'alex.morgan@test.com',
      job_id: '66666666-6666-4666-8666-666666666666',
      job_title: 'Senior Backend Engineer',
      application_id: applicationId,
      action: 'ACCEPTED',
      title: 'Candidate Accepted Offer',
      description: 'Offer for Senior Backend Engineer (USD 140000)',
      metadata: { salary_amount: 140000, currency: 'USD', status: 'ACCEPTED' },
      created_at: new Date('2026-11-20T10:30:00Z'),
    },
  ];

  describe('1. Authentication & Role Authorization Guards', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/activity');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('rejects CANDIDATE role with 403 Forbidden', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateToken);

      const res = await request(app)
        .get('/api/activity')
        .set('Authorization', 'Bearer valid-candidate-token');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('rejects HR user with NULL company assignment with 403 Forbidden', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(hrTokenNoCompany);

      const res = await request(app)
        .get('/api/activity')
        .set('Authorization', 'Bearer hr-no-corp-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/authorized corporate tenant/i);
    });

    it('prohibits HR user from querying activities of a foreign corporate tenant (403 Forbidden)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(hrTokenCompanyA);

      const res = await request(app)
        .get(`/api/activity?companyId=${companyBId}`)
        .set('Authorization', 'Bearer hr-token-a');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Cross-tenant activity log access/i);
    });
  });

  describe('2. Successful Retrieval & Multi-Tenant Scoping', () => {
    it('allows ADMIN to query activity feed across company or specific company', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(adminToken);
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 2 }] }) // Count query
        .mockResolvedValueOnce({ rows: sampleActivities }); // Data query

      const res = await request(app)
        .get('/api/activity')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasMore: false,
      });
    });

    it('strictly scopes HR query to their own corporate companyId', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(hrTokenCompanyA);
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({ rows: [sampleActivities[0]] });

      const res = await request(app)
        .get('/api/activity')
        .set('Authorization', 'Bearer hr-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify that query was called with companyAId
      expect(mockQuery).toHaveBeenCalledTimes(2);
      const countArgs = mockQuery.mock.calls[0];
      expect(countArgs[0]).toContain('company_id = $1');
      expect(countArgs[1]).toContain(companyAId);
    });

    it('allows HR to filter activity feed by candidateId within company scope', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(hrTokenCompanyA);
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({ rows: [sampleActivities[0]] });

      const res = await request(app)
        .get(`/api/activity?candidateId=${candidateId}`)
        .set('Authorization', 'Bearer hr-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const countArgs = mockQuery.mock.calls[0];
      expect(countArgs[0]).toContain('company_id = $1');
      expect(countArgs[0]).toContain('candidate_id = $2');
      expect(countArgs[1]).toEqual([companyAId, candidateId]);
    });

    it('allows HR to filter activity feed by applicationId within company scope', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(hrTokenCompanyA);
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({ rows: [sampleActivities[0]] });

      const res = await request(app)
        .get(`/api/activity?applicationId=${applicationId}`)
        .set('Authorization', 'Bearer hr-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const countArgs = mockQuery.mock.calls[0];
      expect(countArgs[0]).toContain('application_id = $2');
      expect(countArgs[1]).toEqual([companyAId, applicationId]);
    });

    it('allows filtering by activityType enum (e.g. STAGE_TRANSITION)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(adminToken);
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({ rows: [sampleActivities[0]] });

      const res = await request(app)
        .get('/api/activity?activityType=STAGE_TRANSITION')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const countArgs = mockQuery.mock.calls[0];
      expect(countArgs[0]).toContain('activity_type = $2');
      expect(countArgs[1]).toContain('STAGE_TRANSITION');
    });
  });

  describe('3. Query Validation & Defensive Input Hardening', () => {
    it('rejects invalid non-UUID candidateId with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(adminToken);

      const res = await request(app)
        .get('/api/activity?candidateId=malicious-non-uuid')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Invalid activity query parameters/i);
    });

    it('rejects invalid non-UUID applicationId with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(adminToken);

      const res = await request(app)
        .get('/api/activity?applicationId=123-bad-id')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid activityType with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(adminToken);

      const res = await request(app)
        .get('/api/activity?activityType=UNKNOWN_HACK_TYPE')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects negative or zero page and limit with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(adminToken);

      const res = await request(app)
        .get('/api/activity?page=0&limit=-5')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('sanitizes search input with SQL wildcards and prevents injection crashes', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(adminToken);
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get("/api/activity?search=%27%20OR%201=1--%20100%25_bonus")
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const countArgs = mockQuery.mock.calls[0];
      expect(countArgs[0]).toContain('ILIKE');
    });

    it('handles empty activity dataset gracefully without errors', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(adminToken);
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/activity')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
      expect(res.body.pagination.totalPages).toBe(1);
    });

    it('returns HTTP 500 when database query encounters an unexpected failure', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(adminToken);
      mockQuery.mockRejectedValueOnce(new Error('PostgreSQL connection dropped'));

      const res = await request(app)
        .get('/api/activity')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/PostgreSQL connection dropped/i);
    });
  });

  describe('4. Activity Taxonomy Endpoint (/api/activity/types)', () => {
    it('returns the list of supported activity types', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(adminToken);

      const res = await request(app)
        .get('/api/activity/types')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toContain('STAGE_TRANSITION');
      expect(res.body.data).toContain('INTERVIEW_EVENT');
      expect(res.body.data).toContain('OFFER_EVENT');
      expect(res.body.data).toContain('NOTIFICATION_DISPATCH');
      expect(res.body.data).toContain('ONBOARDING_UPDATE');
    });
  });
});
