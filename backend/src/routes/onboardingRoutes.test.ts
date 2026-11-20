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

describe('Candidate Onboarding Tasks API (/api/onboarding) (Floor 19)', () => {
  beforeEach(() => {
    mockVerifyFirebaseIdToken.mockReset();
    mockQuery.mockReset();
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();
  });

  const companyId = '11111111-1111-4111-8111-111111111111';
  const appId = '33333333-3333-4333-8333-333333333333';
  const taskId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
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

  const mockTasks = [
    {
      id: taskId,
      candidate_id: candidateAProfileId,
      offer_id: '44444444-4444-4444-8444-444444444444',
      application_id: appId,
      title: 'Submit Government ID & Verification',
      description: 'Upload valid photo ID',
      category: 'COMPLIANCE',
      is_completed: false,
      due_date: '2026-11-27',
      completed_at: null,
      created_at: new Date('2026-11-20T10:00:00Z'),
      updated_at: new Date('2026-11-20T10:00:00Z'),
      job_title: 'Senior Full Stack Engineer',
      company_name: 'Acme Corporation',
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      candidate_id: candidateAProfileId,
      offer_id: '44444444-4444-4444-8444-444444444444',
      application_id: appId,
      title: 'Complete Direct Deposit Form',
      description: 'Provide banking details',
      category: 'FINANCE',
      is_completed: true,
      due_date: '2026-11-27',
      completed_at: new Date('2026-11-20T11:00:00Z'),
      created_at: new Date('2026-11-20T10:00:00Z'),
      updated_at: new Date('2026-11-20T11:00:00Z'),
      job_title: 'Senior Full Stack Engineer',
      company_name: 'Acme Corporation',
    },
  ];

  describe('1. GET /api/onboarding/me - Retrieve Onboarding Tasks', () => {
    it('returns onboarding tasks with progress metrics for candidate', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      mockQuery
        .mockResolvedValueOnce({ rows: [{ candidate_profile_id: candidateAProfileId }] }) // resolve profile
        .mockResolvedValueOnce({ rows: mockTasks }); // fetch tasks

      const res = await request(app)
        .get('/api/onboarding/me')
        .set('Authorization', 'Bearer valid-cand-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tasks).toHaveLength(2);
      expect(res.body.data.stats).toEqual({
        total: 2,
        completed: 1,
        pending: 1,
        percentComplete: 50,
      });
      expect(res.body.data.tasks[0].title).toBe('Submit Government ID & Verification');
      expect(res.body.data.tasks[0].category).toBe('COMPLIANCE');
    });

    it('filters tasks by applicationId when provided in route', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      mockQuery
        .mockResolvedValueOnce({ rows: [{ candidate_profile_id: candidateAProfileId }] }) // resolve profile
        .mockResolvedValueOnce({ rows: [{ candidate_id: candidateAProfileId }] }) // app ownership check
        .mockResolvedValueOnce({ rows: [mockTasks[0]] }); // query tasks

      const res = await request(app)
        .get(`/api/onboarding/${appId}`)
        .set('Authorization', 'Bearer valid-cand-token');

      expect(res.status).toBe(200);
      expect(res.body.data.tasks).toHaveLength(1);
      expect(res.body.data.stats.total).toBe(1);
    });

    it('blocks candidate from retrieving onboarding tasks of an application belonging to another candidate with 403 Forbidden', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      mockQuery
        .mockResolvedValueOnce({ rows: [{ candidate_profile_id: candidateAProfileId }] })
        .mockResolvedValueOnce({ rows: [{ candidate_id: 'stranger-candidate-profile-id' }] }); // belongs to someone else

      const res = await request(app)
        .get(`/api/onboarding/${appId}`)
        .set('Authorization', 'Bearer valid-cand-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/do not have permission to view onboarding tasks/i);
    });

    it('blocks HR without company assignment from listing onboarding tasks with 403 Forbidden', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue({
        uid: 'hr-no-company-uid',
        email: 'hr@nocompany.com',
        role: 'HR',
        isActive: true,
      });

      mockQuery.mockResolvedValueOnce({ rows: [{ company_id: null }] }); // user has no company

      const res = await request(app)
        .get('/api/onboarding')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/hr user has no assigned company/i);
    });
  });

  describe('2. PATCH /api/onboarding/:id - Toggle Task Completion', () => {
    it('allows Candidate A to mark their own task as completed', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      const taskLookupRow = {
        ...mockTasks[0],
        candidate_firebase_uid: candidateAUid,
        job_company_id: companyId,
      };

      const updatedTaskRow = {
        ...mockTasks[0],
        is_completed: true,
        completed_at: new Date('2026-11-20T12:00:00Z'),
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [taskLookupRow] }) // lookup task
        .mockResolvedValueOnce({ rows: [updatedTaskRow] }); // update

      const res = await request(app)
        .patch(`/api/onboarding/${taskId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ is_completed: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCompleted).toBe(true);
      expect(res.body.data.completedAt).toBeDefined();
    });

    it('allows Candidate A to uncheck their own task (setting completed_at to null)', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      const taskLookupRow = {
        ...mockTasks[1],
        candidate_firebase_uid: candidateAUid,
        job_company_id: companyId,
      };

      const updatedTaskRow = {
        ...mockTasks[1],
        is_completed: false,
        completed_at: null,
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [taskLookupRow] })
        .mockResolvedValueOnce({ rows: [updatedTaskRow] });

      const res = await request(app)
        .patch(`/api/onboarding/${taskId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ is_completed: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isCompleted).toBe(false);
      expect(res.body.data.completedAt).toBeNull();
    });
  });

  describe('3. Cross-Candidate Security Guard on Tasks', () => {
    it('blocks Candidate B from modifying Candidate A onboarding task with 403 Forbidden', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateBToken);

      const taskLookupRow = {
        ...mockTasks[0],
        candidate_firebase_uid: candidateAUid, // Candidate A owns this
        job_company_id: companyId,
      };

      mockQuery.mockResolvedValueOnce({ rows: [taskLookupRow] });

      const res = await request(app)
        .patch(`/api/onboarding/${taskId}`)
        .set('Authorization', 'Bearer valid-cand-b-token')
        .send({ is_completed: true });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/forbidden: you do not have permission/i);
    });

    it('blocks Admin from Company B from modifying an onboarding task belonging to Company A with 403 Forbidden', async () => {
      const foreignCompanyId = '99999999-9999-4999-8999-999999999999';
      mockVerifyFirebaseIdToken.mockResolvedValue({
        uid: 'admin-b-uid',
        email: 'admin@companyb.com',
        role: 'ADMIN',
        companyId: foreignCompanyId,
        isActive: true,
      });

      const taskLookupRow = {
        ...mockTasks[0],
        candidate_firebase_uid: candidateAUid,
        job_company_id: companyId, // task belongs to companyId, caller belongs to foreignCompanyId
      };

      mockQuery.mockResolvedValueOnce({ rows: [taskLookupRow] });

      const res = await request(app)
        .patch(`/api/onboarding/${taskId}`)
        .set('Authorization', 'Bearer valid-admin-b-token')
        .send({ is_completed: true });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/task does not belong to your organization/i);
    });
  });

  describe('4. Input Validation & Not Found', () => {
    it('rejects malformed task UUID with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      const res = await request(app)
        .patch('/api/onboarding/not-a-valid-uuid')
        .set('Authorization', 'Bearer valid-token')
        .send({ is_completed: true });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/invalid onboarding task uuid format/i);
    });

    it('returns 404 when task does not exist', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      mockQuery.mockResolvedValueOnce({ rows: [] }); // not found

      const res = await request(app)
        .patch(`/api/onboarding/${taskId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ is_completed: true });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/onboarding task not found/i);
    });

    it('rejects missing is_completed body with 400 Bad Request', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValue(candidateAToken);

      const res = await request(app)
        .patch(`/api/onboarding/${taskId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body.error)).toMatch(/is_completed or iscompleted boolean is required|validation failed/i);
    });
  });
});
