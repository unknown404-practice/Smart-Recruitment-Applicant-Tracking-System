const mockVerifyFirebaseIdToken = jest.fn();
const mockQuery = jest.fn();

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
  query: (...args: any[]) => mockQuery(...args),
  checkDatabaseConnection: jest.fn().mockResolvedValue({ connected: true, latencyMs: 2 }),
  closeDatabasePool: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import app from '../app';

describe('Onboarding Task APIs (/api/onboarding)', () => {
  const taskId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const candidatePayload = {
    uid: 'candidate-firebase-uid',
    email: 'candidate@example.com',
    role: 'CANDIDATE',
    isActive: true,
  };

  const hrPayload = {
    uid: 'hr-firebase-uid',
    email: 'hr@example.com',
    role: 'HR',
    isActive: true,
  };

  const mockTask = {
    id: taskId,
    offer_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    title: 'Submit identity documents',
    description: 'Upload the required identity documents',
    is_completed: true,
    due_date: '2026-11-20',
    completed_at: '2026-11-16T10:00:00.000Z',
    created_at: '2026-11-15T09:00:00.000Z',
    updated_at: '2026-11-16T10:00:00.000Z',
  };

  beforeEach(() => {
    mockVerifyFirebaseIdToken.mockReset();
    mockQuery.mockReset();
  });

  describe('GET /api/onboarding', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/onboarding');

      expect(res.status).toBe(401);
    });

    it('allows only candidate users', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(hrPayload);

      const res = await request(app)
        .get('/api/onboarding')
        .set('Authorization', 'Bearer valid-hr-token');

      expect(res.status).toBe(403);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('returns onboarding tasks belonging to the authenticated candidate', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(candidatePayload);
      mockQuery.mockResolvedValueOnce({ rows: [mockTask] });

      const res = await request(app)
        .get('/api/onboarding')
        .set('Authorization', 'Bearer valid-candidate-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tasks).toEqual([
        {
          id: taskId,
          offerId: mockTask.offer_id,
          title: mockTask.title,
          description: mockTask.description,
          isCompleted: true,
          dueDate: mockTask.due_date,
          completedAt: mockTask.completed_at,
          createdAt: '2026-11-15T09:00:00.000Z',
          updatedAt: mockTask.updated_at,
        },
      ]);
      expect(mockQuery.mock.calls[0][1]).toEqual([candidatePayload.uid]);
    });
  });

  describe('PATCH /api/onboarding/:id', () => {
    it('marks an owned task as completed', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(candidatePayload);
      mockQuery.mockResolvedValueOnce({ rows: [mockTask] });

      const res = await request(app)
        .patch(`/api/onboarding/${taskId}`)
        .set('Authorization', 'Bearer valid-candidate-token')
        .send({ isCompleted: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.isCompleted).toBe(true);
      expect(mockQuery.mock.calls[0][1]).toEqual([
        true,
        taskId,
        candidatePayload.uid,
      ]);
    });

    it('allows a candidate to reopen a completed task', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(candidatePayload);
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...mockTask, is_completed: false, completed_at: null }],
      });

      const res = await request(app)
        .patch(`/api/onboarding/${taskId}`)
        .set('Authorization', 'Bearer valid-candidate-token')
        .send({ isCompleted: false });

      expect(res.status).toBe(200);
      expect(res.body.data.task.isCompleted).toBe(false);
      expect(res.body.data.task.completedAt).toBeNull();
      expect(mockQuery.mock.calls[0][1][0]).toBe(false);
    });

    it('rejects an invalid task UUID', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(candidatePayload);

      const res = await request(app)
        .patch('/api/onboarding/not-a-uuid')
        .set('Authorization', 'Bearer valid-candidate-token')
        .send({ isCompleted: true });

      expect(res.status).toBe(400);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('rejects a non-boolean completion value', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(candidatePayload);

      const res = await request(app)
        .patch(`/api/onboarding/${taskId}`)
        .set('Authorization', 'Bearer valid-candidate-token')
        .send({ isCompleted: 'true' });

      expect(res.status).toBe(400);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('returns 404 when the task does not belong to the candidate or does not exist', async () => {
      mockVerifyFirebaseIdToken.mockResolvedValueOnce(candidatePayload);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .patch(`/api/onboarding/${taskId}`)
        .set('Authorization', 'Bearer valid-candidate-token')
        .send({ isCompleted: true });

      expect(res.status).toBe(404);
      expect(mockQuery.mock.calls[0][1]).toEqual([
        true,
        taskId,
        candidatePayload.uid,
      ]);
    });
  });
});
