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

describe('Offer Letter Generator and Issue API (/api/offers)', () => {
  beforeEach(() => {
    mockVerifyFirebaseIdToken.mockReset();
    mockQuery.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
  });

  const companyAId = '11111111-1111-4111-8111-111111111111';
  const companyBId = '22222222-2222-4222-8222-222222222222';
  const validAppId = '33333333-3333-4333-8333-333333333333';
  const validOfferId = '44444444-4444-4444-8444-444444444444';
  const candidateUserId = '55555555-5555-4555-8555-555555555555';
  const candidateProfileId = '66666666-6666-4666-8666-666666666666';
  const jobId = '77777777-7777-4777-8777-777777777777';

  const hrTokenCompanyA = {
    uid: 'hr-uid-comp-a',
    email: 'hr@companya.com',
    role: 'HR',
    companyId: companyAId,
    isActive: true,
  };

  const hrTokenCompanyB = {
    uid: 'hr-uid-comp-b',
    email: 'hr@companyb.com',
    role: 'HR',
    companyId: companyBId,
    isActive: true,
  };

  const hrTokenNullCompany = {
    uid: 'hr-uid-null-comp',
    email: 'hr-orphan@company.com',
    role: 'HR',
    companyId: null,
    isActive: true,
  };

  const candidateTokenOwner = {
    uid: 'candidate-owner-uid',
    email: 'jane.candidate@example.com',
    role: 'CANDIDATE',
    companyId: null,
    isActive: true,
  };

  const candidateTokenStranger = {
    uid: 'candidate-stranger-uid',
    email: 'stranger@example.com',
    role: 'CANDIDATE',
    companyId: null,
    isActive: true,
  };

  const adminToken = {
    uid: 'admin-uid-001',
    email: 'admin@companya.com',
    role: 'ADMIN',
    companyId: companyAId,
    isActive: true,
  };

  const mockHrDbUserA = {
    id: 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    firebase_uid: 'hr-uid-comp-a',
    role: 'HR',
    company_id: companyAId,
    is_active: true,
  };

  const mockAppDetailRow = {
    id: validAppId,
    current_stage: 'SELECTED',
    candidate_id: candidateProfileId,
    job_id: jobId,
    job_title: 'Staff Platform Engineer',
    job_company_id: companyAId,
    company_name: 'Acme Cloud Corp',
    candidate_user_id: candidateUserId,
    candidate_name: 'Jane Candidate',
    candidate_email: 'jane.candidate@example.com',
  };

  const mockOfferRecord = {
    id: validOfferId,
    application_id: validAppId,
    salary_amount: '175000.00',
    currency: 'USD',
    start_date: '2026-12-15',
    offer_letter_html: '<html><body>Mock Stored Offer Snapshot</body></html>',
    status: 'DRAFT',
    issued_at: null,
    responded_at: null,
    expires_at: '2026-11-30T00:00:00.000Z',
    created_by: mockHrDbUserA.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // --------------------------------------------------------------------------
  // 1. POST /api/offers (Create Draft Offer)
  // --------------------------------------------------------------------------
  describe('POST /api/offers - Create Draft Offer', () => {
    it('creates a draft offer successfully when application is in SELECTED stage', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      // Query 1: users lookup
      mockQuery.mockResolvedValueOnce({ rows: [mockHrDbUserA] });
      // Query 2: app lookup
      mockQuery.mockResolvedValueOnce({ rows: [mockAppDetailRow] });
      // Query 3: insert offer_records
      mockQuery.mockResolvedValueOnce({ rows: [mockOfferRecord] });

      const res = await request(app)
        .post('/api/offers')
        .set('Authorization', 'Bearer hr-token')
        .send({
          application_id: validAppId,
          salary_amount: 175000,
          currency: 'USD',
          start_date: '2026-12-15',
          expires_at: '2026-11-30',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(validOfferId);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.offerLetterHtml).toContain('Mock Stored Offer Snapshot');
    });

    it('creates a draft offer successfully when application is in OFFERED stage (revision draft)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockHrDbUserA] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockAppDetailRow, current_stage: 'OFFERED' }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [mockOfferRecord] });

      const res = await request(app)
        .post('/api/offers')
        .set('Authorization', 'Bearer hr-token')
        .send({
          application_id: validAppId,
          salary_amount: 180000,
          currency: 'USD',
          start_date: '2026-12-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('rejects offer creation if application is in APPLIED, SCREENING, or INTERVIEW stage', async () => {
      for (const invalidStage of ['APPLIED', 'SCREENING', 'INTERVIEW', 'REJECTED']) {
        mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
        mockQuery.mockResolvedValueOnce({ rows: [mockHrDbUserA] });
        mockQuery.mockResolvedValueOnce({
          rows: [{ ...mockAppDetailRow, current_stage: invalidStage }],
        });

        const res = await request(app)
          .post('/api/offers')
          .set('Authorization', 'Bearer hr-token')
          .send({
            application_id: validAppId,
            salary_amount: 150000,
            start_date: '2026-12-15',
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toMatch(/Application must be in SELECTED or OFFERED stage/i);
      }
    });

    it('returns HTTP 409 Conflict if active offer constraint is violated (Postgres error 23505)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockHrDbUserA] });
      mockQuery.mockResolvedValueOnce({ rows: [mockAppDetailRow] });

      const pgUniqueError: any = new Error('duplicate key value violates unique constraint');
      pgUniqueError.code = '23505';
      pgUniqueError.constraint = 'idx_unique_active_offer_per_app';
      mockQuery.mockRejectedValueOnce(pgUniqueError);

      const res = await request(app)
        .post('/api/offers')
        .set('Authorization', 'Bearer hr-token')
        .send({
          application_id: validAppId,
          salary_amount: 175000,
          start_date: '2026-12-15',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe(
        'An active offer (DRAFT or ISSUED) already exists for this application.'
      );
    });

    it('rejects candidate user role with HTTP 403 Forbidden', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(candidateTokenOwner);

      const res = await request(app)
        .post('/api/offers')
        .set('Authorization', 'Bearer cand-token')
        .send({
          application_id: validAppId,
          salary_amount: 175000,
          start_date: '2026-12-15',
        });

      expect(res.status).toBe(403);
    });

    it('rejects cross-tenant HR user attempting to create offer for another company (403 Forbidden)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyB);
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockHrDbUserA, company_id: companyBId, firebase_uid: 'hr-uid-comp-b' }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [mockAppDetailRow] }); // Job belongs to Company A

      const res = await request(app)
        .post('/api/offers')
        .set('Authorization', 'Bearer hr-token-b')
        .send({
          application_id: validAppId,
          salary_amount: 175000,
          start_date: '2026-12-15',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Application does not belong to your organization/i);
    });

    it('fails closed with HTTP 403 Forbidden if HR user has no assigned company', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenNullCompany);
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockHrDbUserA, company_id: null, firebase_uid: 'hr-uid-null-comp' }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [mockAppDetailRow] });

      const res = await request(app)
        .post('/api/offers')
        .set('Authorization', 'Bearer hr-token-null')
        .send({
          application_id: validAppId,
          salary_amount: 175000,
          start_date: '2026-12-15',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/HR user has no assigned company/i);
    });

    it('rejects requests with missing or negative salary_amount (400 Bad Request)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);

      const res = await request(app)
        .post('/api/offers')
        .set('Authorization', 'Bearer hr-token')
        .send({
          application_id: validAppId,
          salary_amount: -5000,
          start_date: '2026-12-15',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 2. PATCH /api/offers/:id/issue (Issue Offer)
  // --------------------------------------------------------------------------
  describe('PATCH /api/offers/:id/issue - Issue Offer', () => {
    const lockedOfferDetailRow = {
      id: validOfferId,
      application_id: validAppId,
      salary_amount: '175000.00',
      currency: 'USD',
      start_date: '2026-12-15',
      offer_letter_html: '<html><body>Offer Letter</body></html>',
      status: 'DRAFT',
      issued_at: null,
      responded_at: null,
      expires_at: '2026-11-30T00:00:00.000Z',
      created_by: mockHrDbUserA.id,
      current_stage: 'SELECTED',
      candidate_id: candidateProfileId,
      job_id: jobId,
      job_title: 'Staff Platform Engineer',
      job_company_id: companyAId,
      company_name: 'Acme Cloud Corp',
      candidate_user_id: candidateUserId,
      candidate_name: 'Jane Candidate',
      candidate_email: 'jane.candidate@example.com',
    };

    it('atomically issues offer, transitions SELECTED app to OFFERED, records audit, and queues notification', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      // Query 1: caller user query (via pool.query)
      mockQuery.mockResolvedValueOnce({ rows: [mockHrDbUserA] });

      // Transaction queries (via mockClient.query):
      // 1. BEGIN
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      // 2. SELECT ... FOR UPDATE OF a
      mockClientQuery.mockResolvedValueOnce({ rows: [lockedOfferDetailRow] });
      // 3. UPDATE applications SET current_stage = 'OFFERED'
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: validAppId, current_stage: 'OFFERED' }] });
      // 4. INSERT INTO application_stage_history
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'hist-1', to_stage: 'OFFERED' }] });
      // 5. UPDATE offer_records SET status = 'ISSUED'
      mockClientQuery.mockResolvedValueOnce({
        rows: [{ ...mockOfferRecord, status: 'ISSUED', issued_at: new Date().toISOString() }],
      });
      // 6. INSERT INTO notification_events
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'notif-1', status: 'PENDING' }] });
      // 7. COMMIT
      mockClientQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .patch(`/api/offers/${validOfferId}/issue`)
        .set('Authorization', 'Bearer hr-token')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.offer.status).toBe('ISSUED');
      expect(res.body.data.applicationStage).toBe('OFFERED');
      expect(res.body.data.notificationQueued).toBe(true);

      // Verify transaction queries were executed in sequence
      expect(mockClientQuery).toHaveBeenCalledWith('BEGIN');
      expect(mockClientQuery).toHaveBeenCalledWith('COMMIT');
      expect(mockClientRelease).toHaveBeenCalledTimes(1);

      // Verify notification payload inserted
      const notifCall = mockClientQuery.mock.calls.find((call) =>
        call[0].includes('INSERT INTO notification_events')
      );
      expect(notifCall).toBeDefined();
      expect(notifCall[1][0]).toBe(candidateUserId);
      expect(notifCall[1][1]).toContain('Official Offer of Employment');
    });

    it('successfully issues offer when application is already in OFFERED stage without fake transition', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockHrDbUserA] });

      // Transaction queries:
      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClientQuery.mockResolvedValueOnce({
        rows: [{ ...lockedOfferDetailRow, current_stage: 'OFFERED' }],
      }); // SELECT FOR UPDATE
      // (No application update or stage history query since already OFFERED)
      mockClientQuery.mockResolvedValueOnce({
        rows: [{ ...mockOfferRecord, status: 'ISSUED', issued_at: new Date().toISOString() }],
      }); // UPDATE offer_records
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'notif-1' }] }); // INSERT notification_events
      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // COMMIT

      const res = await request(app)
        .patch(`/api/offers/${validOfferId}/issue`)
        .set('Authorization', 'Bearer hr-token')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.offer.status).toBe('ISSUED');
      expect(res.body.data.applicationStage).toBe('OFFERED');

      // Verify no stage transition update was called
      const appUpdateCall = mockClientQuery.mock.calls.find((call) =>
        call[0].includes('UPDATE applications SET current_stage')
      );
      expect(appUpdateCall).toBeUndefined();
    });

    it('rejects duplicate issuance with HTTP 400 Bad Request if offer is already ISSUED', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockHrDbUserA] });

      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClientQuery.mockResolvedValueOnce({
        rows: [{ ...lockedOfferDetailRow, status: 'ISSUED' }],
      }); // SELECT FOR UPDATE
      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const res = await request(app)
        .patch(`/api/offers/${validOfferId}/issue`)
        .set('Authorization', 'Bearer hr-token')
        .send();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Offer has already been issued/i);
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClientRelease).toHaveBeenCalledTimes(1);
    });

    it('rejects issuance with HTTP 400 Bad Request if application is in APPLIED stage', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockHrDbUserA] });

      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClientQuery.mockResolvedValueOnce({
        rows: [{ ...lockedOfferDetailRow, current_stage: 'APPLIED' }],
      }); // SELECT FOR UPDATE
      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const res = await request(app)
        .patch(`/api/offers/${validOfferId}/issue`)
        .set('Authorization', 'Bearer hr-token')
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/must be in SELECTED or OFFERED stage/i);
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('rejects cross-tenant HR user from issuing competitor offer (403 Forbidden)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyB);
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockHrDbUserA, company_id: companyBId, firebase_uid: 'hr-uid-comp-b' }],
      });

      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClientQuery.mockResolvedValueOnce({ rows: [lockedOfferDetailRow] }); // Job belongs to Company A
      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const res = await request(app)
        .patch(`/api/offers/${validOfferId}/issue`)
        .set('Authorization', 'Bearer hr-token-b')
        .send();

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Offer does not belong to your organization/i);
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('rolls back the transaction if notification event insertion fails', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [mockHrDbUserA] });

      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClientQuery.mockResolvedValueOnce({ rows: [lockedOfferDetailRow] }); // SELECT FOR UPDATE
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: validAppId }] }); // UPDATE apps
      mockClientQuery.mockResolvedValueOnce({ rows: [{ id: 'hist-1' }] }); // INSERT history
      mockClientQuery.mockResolvedValueOnce({ rows: [mockOfferRecord] }); // UPDATE offer
      // Notification insertion fails
      mockClientQuery.mockRejectedValueOnce(new Error('DB notification insertion connection drop'));
      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const res = await request(app)
        .patch(`/api/offers/${validOfferId}/issue`)
        .set('Authorization', 'Bearer hr-token')
        .send();

      expect(res.status).toBe(500);
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClientRelease).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // 3. GET /api/offers/:id (Retrieve Offer Details)
  // --------------------------------------------------------------------------
  describe('GET /api/offers/:id - Retrieve Offer Details', () => {
    const candidateOwnerRow = {
      ...mockOfferRecord,
      job_title: 'Staff Platform Engineer',
      company_name: 'Acme Cloud Corp',
      job_company_id: companyAId,
      candidate_firebase_uid: 'candidate-owner-uid',
      candidate_user_id: candidateUserId,
    };

    it('allows candidate owner to retrieve their own offer with HTML snapshot', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(candidateTokenOwner);
      mockQuery.mockResolvedValueOnce({ rows: [candidateOwnerRow] });

      const res = await request(app)
        .get(`/api/offers/${validOfferId}`)
        .set('Authorization', 'Bearer cand-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(validOfferId);
      expect(res.body.data.offerLetterHtml).toBe(mockOfferRecord.offer_letter_html);
    });

    it('forbids stranger candidate from retrieving another candidate offer (403 Forbidden)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(candidateTokenStranger);
      mockQuery.mockResolvedValueOnce({ rows: [candidateOwnerRow] });

      const res = await request(app)
        .get(`/api/offers/${validOfferId}`)
        .set('Authorization', 'Bearer stranger-token');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/do not have permission to access this offer/i);
    });

    it('allows HR user of the same company to retrieve offer', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [candidateOwnerRow] });

      const res = await request(app)
        .get(`/api/offers/${validOfferId}`)
        .set('Authorization', 'Bearer hr-token');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(validOfferId);
    });

    it('forbids cross-tenant HR user from retrieving offer of another company (403 Forbidden)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyB);
      mockQuery.mockResolvedValueOnce({ rows: [candidateOwnerRow] }); // Job belongs to Company A

      const res = await request(app)
        .get(`/api/offers/${validOfferId}`)
        .set('Authorization', 'Bearer hr-token-b');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/access offers for another organization/i);
    });

    it('returns HTTP 404 Not Found if offer does not exist', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`/api/offers/${validOfferId}`)
        .set('Authorization', 'Bearer hr-token');

      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/Offer not found/i);
    });

    it('returns HTTP 400 Bad Request for malformed non-UUID offer ID', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrTokenCompanyA);

      const res = await request(app)
        .get('/api/offers/invalid-uuid-id')
        .set('Authorization', 'Bearer hr-token');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Invalid offer UUID format/i);
    });
  });
});
