import { Router } from 'express';
import { authenticateFirebase, requireRole } from '../middleware/authMiddleware';
import { AnalyticsController } from '../controllers/analyticsController';

const router = Router();

// Protect all /api/analytics endpoints with Firebase authentication
router.use(authenticateFirebase);

/**
 * GET /api/analytics/summary
 * Primary hiring KPI metrics and funnel aggregation endpoint.
 */
router.get(
  '/summary',
  requireRole(['ADMIN', 'SUPER_ADMIN', 'HR', 'HR_MANAGER', 'RECRUITER']),
  AnalyticsController.getSummary
);

/**
 * GET /api/analytics/filters
 * Available jobs and departments for the caller's company.
 */
router.get(
  '/filters',
  requireRole(['ADMIN', 'SUPER_ADMIN', 'HR', 'HR_MANAGER', 'RECRUITER']),
  AnalyticsController.getFilters
);

export default router;
