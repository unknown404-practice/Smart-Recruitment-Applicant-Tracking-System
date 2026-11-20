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

describe('Candidate Offer Response API (/api/offers/:id/respond) & Security Guard (Floor 19)', () => {
  beforeEach(() => {
    mockVerifyFirebaseIdToken.mockReset();
    mockQuery.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
  });

  const companyId = '11111111-1111-4111-8111-111111111111';
  const offerId = '44444444-4444-4444-8444-444444444444';
  const appId = '33333333-3333-4333-8333-333333333333';
  const candidateAUserId = '55555555-5555-4555-8555-555555555555';
  const candidateAProfileId = '66666666-6666-4666-8666-666666666666';
  const candidateAUid = 'cand-uid-alex-morgan';

  const candidateBUid = 'cand-uid-unauthorized-bob';

  const candidateAToken = {
    uid: candidateAUid,
    email: 'alex.morgan@test.com',
    role: 'CANDIDATE',
    isActive: true,
  };

  const candidateBToken = {
    uid: candidateBUid,
    email: 'bob.unauthorized@test.com',
    role: 'CANDIDATE',
    isActive: true,
  };

  const mockCandidateAUserRow = {
    id: candidateAUserId,
    full_name: 'Alex Morgan',
    email: 'alex.morgan@test.com',
    role: 'CANDIDATE',
    company_id: null,
  };

  const mockCandidateBUserRow = {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    full_name: 'Bob Candidate',
    email: 'bob.unauthorized@test.com',
    role: 'CANDIDATE',
    company_id: null,
  };

  const mockIssuedOfferRow = {
    id: offerId,
    application_id: appId,
    salary_amount: '185000.00',
    currency: 'USD',
    start_date: '2026-12-01',
    offer_letter_html: '<p>Formal Offer Letter</p>',
    status: 'ISSUED',
    issued_at: new Date('2026-11-15T10:00:00Z'),
    responded_at: null,
    accepted_at: null,
    declined_at: null,
    expires_at: new Date('2026-12-31T23:59:59Z'),
    created_by: '99999999-9999-4999-8999-999999999999',
    created_at: new Date('2026-11-15T10:00:00Z'),
    updated_at: new Date('2026-11-15T10:00:00Z'),
    current_stage: 'OFFERED',
    candidate_id: candidateAProfileId,
    job_id: '77777777-7777-4777-8777-777777777777',
    job_title: 'Senior Full Stack Engineer',
    job_company_id: companyId,
    company_name: 'Acme Corporation',
    candidate_user_id: candidateAUserId,
    candidate_firebase_uid: candidateAUid,
    candidate_name: 'Alex Morgan',
    candidate_email: 'alex.morgan@test.com',
  };

  describe('1. Candidate Offer Acceptance (action: ACCEPT)', () => {
    it('accepts offer atomically: updates status to ACCEPTED, application stage to HIRED with hired_at, and auto-spawns onboarding tasks', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockIssuedOfferRow] }) // lock offer
        .mockResolvedValueOnce({
          rows: [
            {
              id: appId,
              current_stage: 'HIRED',
              hired_at: new Date(),
            },
          ],
        }) // update application
        .mockResolvedValueOnce({}) // insert stage history
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'task-1',
              candidate_id: candidateAProfileId,
              offer_id: offerId,
              application_id: appId,
              title: 'Submit Government ID & Verification',
              category: 'COMPLIANCE',
              is_completed: false,
              due_date: '2026-11-27',
              completed_at: null,
            },
            {
              id: 'task-2',
              candidate_id: candidateAProfileId,
              offer_id: offerId,
              application_id: appId,
              title: 'Complete Direct Deposit Form',
              category: 'FINANCE',
              is_completed: false,
              due_date: '2026-11-27',
              completed_at: null,
            },
            {
              id: 'task-3',
              candidate_id: candidateAProfileId,
              offer_id: offerId,
              application_id: appId,
              title: 'Select Workstation Hardware & Peripherals',
              category: 'EQUIPMENT',
              is_completed: false,
              due_date: '2026-11-30',
              completed_at: null,
            },
            {
              id: 'task-4',
              candidate_id: candidateAProfileId,
              offer_id: offerId,
              application_id: appId,
              title: 'Sign Intellectual Property & Security Agreement',
              category: 'LEGAL',
              is_completed: false,
              due_date: '2026-11-25',
              completed_at: null,
            },
          ],
        }) // auto-spawn onboarding tasks
        .mockResolvedValueOnce({
          rows: [
            {
              ...mockIssuedOfferRow,
              status: 'ACCEPTED',
              accepted_at: new Date(),
              responded_at: new Date(),
            },
          ],
        }) // update offer
        .mockResolvedValueOnce({}) // notification event
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .post(`/api/offers/${offerId}/respond`)
        .set('Authorization', 'Bearer valid-cand-token')
        .send({
          action: 'ACCEPT',
          signature: 'Alex Morgan',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.offer.status).toBe('ACCEPTED');
      expect(res.body.data.application.currentStage).toBe('HIRED');
      expect(res.body.data.application.hiredAt).toBeDefined();
      expect(res.body.data.onboardingTasks).toHaveLength(4);
      expect(res.body.data.onboardingTasks[0].title).toBe('Submit Government ID & Verification');
      expect(res.body.data.onboardingTasks[0].category).toBe('COMPLIANCE');
      expect(res.body.data.onboardingTasks[1].category).toBe('FINANCE');
      expect(res.body.data.onboardingTasks[2].category).toBe('EQUIPMENT');
      expect(res.body.data.onboardingTasks[3].category).toBe('LEGAL');
      expect(mockClientRelease).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Candidate Offer Decline (action: DECLINE)', () => {
    it('declines offer atomically: updates status to DECLINED with reason and transitions application to REJECTED', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockIssuedOfferRow] }) // lock offer
        .mockResolvedValueOnce({
          rows: [
            {
              id: appId,
              current_stage: 'REJECTED',
            },
          ],
        }) // update application
        .mockResolvedValueOnce({}) // insert stage history
        .mockResolvedValueOnce({
          rows: [
            {
              ...mockIssuedOfferRow,
              status: 'DECLINED',
              declined_at: new Date(),
              responded_at: new Date(),
              declined_reason: 'Accepted competing counter-offer',
            },
          ],
        }) // update offer
        .mockResolvedValueOnce({}) // notification event
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .post(`/api/offers/${offerId}/respond`)
        .set('Authorization', 'Bearer valid-cand-token')
        .send({
          action: 'DECLINE',
          reason: 'Accepted competing counter-offer',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.offer.status).toBe('DECLINED');
      expect(res.body.data.offer.declinedReason).toBe('Accepted competing counter-offer');
      expect(res.body.data.application.currentStage).toBe('REJECTED');
      expect(mockClientRelease).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Strict Candidate Row-Level Ownership & Cross-Candidate Guards', () => {
    it('blocks Candidate B from accepting or declining Candidate A offer with 403 Forbidden', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateBToken);

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockIssuedOfferRow] }) // lock offer (belongs to candidate A)
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .post(`/api/offers/${offerId}/respond`)
        .set('Authorization', 'Bearer valid-cand-b-token')
        .send({
          action: 'ACCEPT',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/forbidden: you do not have permission/i);
      expect(mockClientRelease).toHaveBeenCalledTimes(1);
    });

    it('blocks unauthorized roles (e.g. standard HR user) from pretending to be candidate to accept offer with 403 Forbidden', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue({
        uid: 'hr-uid',
        email: 'hr@acme.com',
        role: 'HR',
        companyId: companyId,
        isActive: true,
      });

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockIssuedOfferRow] })
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .post(`/api/offers/${offerId}/respond`)
        .set('Authorization', 'Bearer valid-hr-token')
        .send({ action: 'ACCEPT' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/only the candidate or an authorized admin/i);
    });

    it('blocks Admin from Company B from responding to an offer of Company A with 403 Forbidden', async () => {
      const foreignCompanyId = '99999999-9999-4999-8999-999999999999';
      mockVerifyFirebaseIdToken.mockResolvedValue({
        uid: 'admin-b-uid',
        email: 'admin@companyb.com',
        role: 'ADMIN',
        companyId: foreignCompanyId,
        isActive: true,
      });

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockIssuedOfferRow] }) // mockIssuedOfferRow belongs to companyId
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .post(`/api/offers/${offerId}/respond`)
        .set('Authorization', 'Bearer valid-admin-b-token')
        .send({ action: 'ACCEPT' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/offer does not belong to your organization/i);
      expect(mockClientRelease).toHaveBeenCalledTimes(1);
    });

    it('enforces that GET /api/offers excludes DRAFT offers for candidates', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: offerId,
            application_id: appId,
            salary_amount: '185000.00',
            currency: 'USD',
            status: 'ISSUED',
            job_title: 'Senior Full Stack Engineer',
            company_name: 'Acme Corporation',
          },
        ],
      });

      const res = await request(app)
        .get('/api/offers')
        .set('Authorization', 'Bearer valid-cand-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      // Verify query string filtered out DRAFT
      expect(mockQuery.mock.calls[0][0]).toContain("o.status != 'DRAFT'");
      expect(mockQuery.mock.calls[0][1]).toEqual([candidateAUid]);
    });
  });

  describe('4. Lifecycle & State Integrity Checks', () => {
    it('rejects double acceptance when offer is already ACCEPTED with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      const alreadyAcceptedRow = {
        ...mockIssuedOfferRow,
        status: 'ACCEPTED',
      };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [alreadyAcceptedRow] })
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .post(`/api/offers/${offerId}/respond`)
        .set('Authorization', 'Bearer valid-token')
        .send({ action: 'ACCEPT' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/already been accepted/i);
    });

    it('rejects responding to a DRAFT offer that has not been officially issued with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      const draftOfferRow = {
        ...mockIssuedOfferRow,
        status: 'DRAFT',
      };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [draftOfferRow] })
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .post(`/api/offers/${offerId}/respond`)
        .set('Authorization', 'Bearer valid-token')
        .send({ action: 'ACCEPT' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/cannot respond to a draft offer/i);
    });

    it('rejects responding to an EXPIRED offer with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      const expiredOfferRow = {
        ...mockIssuedOfferRow,
        status: 'EXPIRED',
      };

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [expiredOfferRow] })
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .post(`/api/offers/${offerId}/respond`)
        .set('Authorization', 'Bearer valid-token')
        .send({ action: 'ACCEPT' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/offer has expired/i);
    });

    it('returns 404 Not Found when offer UUID does not exist', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      mockClientQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // not found
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .post(`/api/offers/${offerId}/respond`)
        .set('Authorization', 'Bearer valid-token')
        .send({ action: 'ACCEPT' });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/offer not found/i);
    });
  });

  describe('5. Input Validation', () => {
    it('rejects invalid action values with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      const res = await request(app)
        .post(`/api/offers/${offerId}/respond`)
        .set('Authorization', 'Bearer valid-token')
        .send({ action: 'MAYBE' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body.error)).toMatch(/action must be either accept or decline|validation failed/i);
    });

    it('rejects malformed offer UUID with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      const res = await request(app)
        .post('/api/offers/not-a-valid-uuid/respond')
        .set('Authorization', 'Bearer valid-token')
        .send({ action: 'ACCEPT' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/invalid offer uuid format/i);
    });
  });
});
