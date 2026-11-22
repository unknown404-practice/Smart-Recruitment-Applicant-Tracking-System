import { Router } from 'express';
import { authenticateFirebase, requireRole } from '../middleware/authMiddleware';
import { getAnalyticsSummary } from '../controllers/analyticsController';

const router = Router();

// Protect all /api/analytics endpoints with Firebase authentication
router.use(authenticateFirebase);

/**
 * GET /api/analytics/summary
 * Computes hiring KPI metrics (Volume, Stage Conversions, Time-to-Hire, Offer Acceptance).
 * Restricted to staff roles: ADMIN, SUPER_ADMIN, HR, HR_MANAGER, RECRUITER.
 */
router.get(
  '/summary',
  requireRole(['ADMIN', 'SUPER_ADMIN', 'HR', 'HR_MANAGER', 'RECRUITER']),
  getAnalyticsSummary
);

/**
 * GET /api/analytics (Alias to /summary)
 */
router.get(
  '/',
  requireRole(['ADMIN', 'SUPER_ADMIN', 'HR', 'HR_MANAGER', 'RECRUITER']),
  getAnalyticsSummary
);

export default router;
