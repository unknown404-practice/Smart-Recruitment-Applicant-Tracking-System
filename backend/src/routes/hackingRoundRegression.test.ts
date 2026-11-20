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

describe('Hacking Round Hardening & Regression Suite', () => {
  beforeEach(() => {
    mockVerifyFirebaseIdToken.mockReset();
    mockQuery.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
  });

  const companyA = '11111111-1111-4111-8111-111111111111';
  const companyB = '22222222-2222-4222-8222-222222222222';
  const appId = '33333333-3333-4333-8333-333333333333';
  const taskId = '44444444-4444-4444-8444-444444444444';
  const offerId = '55555555-5555-4555-8555-555555555555';

  const recruiterCompanyA = {
    uid: 'recruiter-comp-a-uid',
    email: 'recruiter@company-a.com',
    role: 'RECRUITER',
    companyId: companyA,
    isActive: true,
  };

  const recruiterCompanyB = {
    uid: 'recruiter-comp-b-uid',
    email: 'recruiter@company-b.com',
    role: 'RECRUITER',
    companyId: companyB,
    isActive: true,
  };

  const adminCompanyA = {
    uid: 'admin-comp-a-uid',
    email: 'admin@company-a.com',
    role: 'ADMIN',
    companyId: companyA,
    isActive: true,
  };

  const hrCompanyA = {
    uid: 'hr-comp-a-uid',
    email: 'hr@company-a.com',
    role: 'HR',
    companyId: companyA,
    isActive: true,
  };

  describe('1. Application Search Boundary & Malformed Date Defense', () => {
    it('returns 400 Bad Request when startDate is an unparseable malformed string', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'hr-db-id', role: 'HR', company_id: companyA, is_active: true }],
      });

      const res = await request(app)
        .get('/api/applications?startDate=invalid-date-format')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Invalid startDate format/i);
    });

    it('returns 400 Bad Request when endDate is an unparseable malformed string', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'hr-db-id', role: 'HR', company_id: companyA, is_active: true }],
      });

      const res = await request(app)
        .get('/api/applications?endDate=not-a-valid-date')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Invalid endDate format/i);
    });

    it('returns 400 Bad Request when startDate is strictly after endDate', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'hr-db-id', role: 'HR', company_id: companyA, is_active: true }],
      });

      const res = await request(app)
        .get('/api/applications?startDate=2026-11-20&endDate=2026-11-10')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/startDate cannot be after endDate/i);
    });

    it('escapes SQL LIKE wildcards in search query to prevent unintended match expansion', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'hr-db-id', role: 'HR', company_id: companyA, is_active: true }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: 0 }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/applications?search=%_malicious')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(200);
      const listCall = mockQuery.mock.calls[2];
      const params = listCall[1];
      // Escaped wildcard parameter should contain \%\_malicious
      expect(params).toContain('%\\%\\_malicious%');
    });
  });

  describe('2. Recruiter Role Support & Cross-Tenant Application Scoping', () => {
    it('allows RECRUITER to list applications scoped to their company', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(recruiterCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'recruiter-db-id', role: 'RECRUITER', company_id: companyA, is_active: true }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: 0 }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/applications')
        .set('Authorization', 'Bearer valid-recruiter-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const countCall = mockQuery.mock.calls[1];
      expect(countCall[0]).toContain('j.company_id = $1');
      expect(countCall[1]).toContain(companyA);
    });

    it('allows RECRUITER to inspect an application belonging to their own company', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(recruiterCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: appId,
            job_id: 'job-1',
            candidate_id: 'cand-1',
            candidate_firebase_uid: 'cand-uid-1',
            job_company_id: companyA,
          },
        ],
      });

      const res = await request(app)
        .get(`/api/applications/${appId}`)
        .set('Authorization', 'Bearer valid-recruiter-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(appId);
    });

    it('forbids RECRUITER from inspecting an application belonging to another company (403 Forbidden)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(recruiterCompanyB);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: appId,
            job_id: 'job-1',
            candidate_id: 'cand-1',
            candidate_firebase_uid: 'cand-uid-1',
            job_company_id: companyA, // Belongs to Company A
          },
        ],
      });

      const res = await request(app)
        .get(`/api/applications/${appId}`)
        .set('Authorization', 'Bearer valid-recruiter-token-b');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Forbidden/i);
    });
  });

  describe('3. Multi-Tenant Offer Listing Boundaries', () => {
    it('scopes GET /api/offers for RECRUITER to their assigned company', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(recruiterCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/offers')
        .set('Authorization', 'Bearer valid-recruiter-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const sqlCall = mockQuery.mock.calls[0];
      expect(sqlCall[0]).toContain('WHERE j.company_id = $1');
      expect(sqlCall[1]).toContain(companyA);
    });

    it('scopes GET /api/offers for ADMIN with companyId to their assigned company', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(adminCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/offers')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const sqlCall = mockQuery.mock.calls[0];
      expect(sqlCall[0]).toContain('WHERE j.company_id = $1');
      expect(sqlCall[1]).toContain(companyA);
    });
  });

  describe('4. Onboarding Tasks Multi-Tenant Scoping for RECRUITER & Staff', () => {
    it('scopes GET /api/onboarding for RECRUITER to their company jobs', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(recruiterCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/onboarding')
        .set('Authorization', 'Bearer valid-recruiter-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const sqlCall = mockQuery.mock.calls[0];
      expect(sqlCall[0]).toContain('AND j.company_id = $1');
      expect(sqlCall[1]).toContain(companyA);
    });

    it('forbids RECRUITER from modifying onboarding task of another company (403 Forbidden)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(recruiterCompanyB);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: taskId,
            candidate_id: 'cand-1',
            candidate_firebase_uid: 'cand-alice-uid',
            job_company_id: companyA, // Belongs to Company A
            is_completed: false,
          },
        ],
      });

      const res = await request(app)
        .patch(`/api/onboarding/${taskId}`)
        .set('Authorization', 'Bearer valid-recruiter-token-b')
        .send({ is_completed: true });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Forbidden/i);
    });
  });

  describe('5. Single Offer Retrieval & Response Isolation (RECRUITER and DB-backed ADMIN)', () => {
    it('allows RECRUITER to retrieve an offer belonging to their company', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(recruiterCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: offerId,
            application_id: appId,
            salary_amount: '120000',
            currency: 'USD',
            start_date: '2026-12-01',
            offer_letter_html: '<p>Offer</p>',
            status: 'ISSUED',
            job_company_id: companyA,
            candidate_firebase_uid: 'cand-uid-1',
          },
        ],
      });

      const res = await request(app)
        .get(`/api/offers/${offerId}`)
        .set('Authorization', 'Bearer valid-recruiter-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(offerId);
    });

    it('forbids RECRUITER from retrieving an offer belonging to another company (403 Forbidden)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(recruiterCompanyB);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: offerId,
            application_id: appId,
            job_company_id: companyA, // Belongs to Company A
            candidate_firebase_uid: 'cand-uid-1',
          },
        ],
      });

      const res = await request(app)
        .get(`/api/offers/${offerId}`)
        .set('Authorization', 'Bearer valid-recruiter-token-b');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Forbidden/i);
    });

    it('forbids company-assigned ADMIN from retrieving an offer belonging to another company even when token lacks claim', async () => {
      // Token has no companyId
      mockVerifyFirebaseIdToken.mockResolvedValueOnce({
        uid: 'admin-without-claim-uid',
        email: 'admin@company-a.com',
        role: 'ADMIN',
      });
      // Offer query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: offerId,
            application_id: appId,
            job_company_id: companyB, // Belongs to Company B
            candidate_firebase_uid: 'cand-uid-1',
          },
        ],
      });
      // DB user query resolves company_id = companyA
      mockQuery.mockResolvedValueOnce({
        rows: [{ company_id: companyA }],
      });

      const res = await request(app)
        .get(`/api/offers/${offerId}`)
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Forbidden: Offer does not belong to your organization/i);
    });

    it('forbids company-assigned ADMIN from responding to an offer of another company even when token lacks claim', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce({
        uid: 'admin-without-claim-uid',
        email: 'admin@company-a.com',
        role: 'ADMIN',
      });
      mockClientQuery.mockResolvedValueOnce({}); // BEGIN
      mockClientQuery.mockResolvedValueOnce({
        rows: [
          {
            id: offerId,
            application_id: appId,
            job_company_id: companyB, // Belongs to Company B
            status: 'ISSUED',
            candidate_firebase_uid: 'cand-uid-1',
          },
        ],
      });
      // DB query resolves company_id = companyA
      mockClientQuery.mockResolvedValueOnce({
        rows: [{ company_id: companyA }],
      });
      mockClientQuery.mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .post(`/api/offers/${offerId}/respond`)
        .set('Authorization', 'Bearer valid-admin-token')
        .send({ action: 'ACCEPT', acceptedTerms: true });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Forbidden: Offer does not belong to your organization/i);
    });
  });

  describe('6. Resume Streaming Anti-IDOR & Multi-Tenant Protection', () => {
    const resumeId = '66666666-6666-4666-8666-666666666666';

    it('forbids company-assigned ADMIN from downloading resume of candidate who applied to another company', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(adminCompanyA);
      // Resume lookup
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: resumeId,
            candidate_id: 'cand-profile-1',
            stored_file_name: 'test-resume.pdf',
            candidate_firebase_uid: 'cand-other-uid',
          },
        ],
      });
      // Application match check: returns 0 matches for companyA
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`/api/resumes/${resumeId}/download`)
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/outside your organization/i);
    });

    it('forbids RECRUITER from downloading resume of candidate who applied to another company', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(recruiterCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: resumeId,
            candidate_id: 'cand-profile-1',
            stored_file_name: 'test-resume.pdf',
            candidate_firebase_uid: 'cand-other-uid',
          },
        ],
      });
      // No match for companyA
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`/api/resumes/${resumeId}/download`)
        .set('Authorization', 'Bearer valid-recruiter-token');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/outside your organization/i);
    });
  });

  describe('7. Application Audit History Scoping', () => {
    it('allows RECRUITER to inspect stage audit timeline for their company application', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(recruiterCompanyA);
      // Application query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: appId,
            candidate_firebase_uid: 'cand-uid-1',
            job_company_id: companyA,
          },
        ],
      });
      // History rows query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'hist-1',
            application_id: appId,
            from_stage: 'APPLIED',
            to_stage: 'SCREENING',
            reason: 'Screening passed',
            changed_at: new Date().toISOString(),
          },
        ],
      });

      const res = await request(app)
        .get(`/api/applications/${appId}/history`)
        .set('Authorization', 'Bearer valid-recruiter-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('forbids company-assigned ADMIN from inspecting history of application belonging to another company', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(adminCompanyA);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: appId,
            candidate_firebase_uid: 'cand-uid-1',
            job_company_id: companyB, // Company B
          },
        ],
      });

      const res = await request(app)
        .get(`/api/applications/${appId}/history`)
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/another company/i);
    });
  });

  describe('8. Activity Feed Multi-Tenant Defense', () => {
    it('forbids company-assigned ADMIN from accessing activity feed of another company via query param', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(adminCompanyA);

      const res = await request(app)
        .get(`/api/activity?companyId=${companyB}`)
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Cross-tenant activity log access is strictly prohibited/i);
    });
  });

  describe('9. Admin Role Assignment for RECRUITER', () => {
    it('allows Admin to update a user role to RECRUITER', async () => {
      const targetUserId = '77777777-7777-4777-8777-777777777777';
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(adminCompanyA);
      // Target user lookup
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: targetUserId,
            firebase_uid: 'target-user-fb-uid',
            email: 'recruiter@company-a.com',
            full_name: 'Recruiter Bob',
            role: 'CANDIDATE',
            company_id: companyA,
            is_active: true,
          },
        ],
      });
      // Database UPDATE
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: targetUserId,
            firebase_uid: 'target-user-fb-uid',
            role: 'RECRUITER',
            company_id: companyA,
          },
        ],
      });

      const res = await request(app)
        .patch(`/api/admin/users/${targetUserId}/role`)
        .set('Authorization', 'Bearer valid-admin-token')
        .send({ role: 'RECRUITER' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('RECRUITER');
    });
  });
});
