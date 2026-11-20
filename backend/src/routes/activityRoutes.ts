import { Router } from 'express';
import { authenticateFirebase, requireRole } from '../middleware/authMiddleware';
import { getActivityFeed, getActivityTypes } from '../controllers/activityController';

const router = Router();

// Protect all /api/activity routes with Firebase authentication
router.use(authenticateFirebase);

/**
 * GET /api/activity/types
 * Returns registered activity event types taxonomy.
 * Restricted to administrative and recruiter staff.
 */
router.get('/types', requireRole(['ADMIN', 'SUPER_ADMIN', 'HR', 'HR_MANAGER', 'RECRUITER']), getActivityTypes);

/**
 * GET /api/activity
 * Unified system activity feed aggregating cross-workflow events.
 * Accessible to ADMIN and HR users with corporate tenant boundaries.
 */
router.get('/', requireRole(['ADMIN', 'SUPER_ADMIN', 'HR', 'HR_MANAGER', 'RECRUITER']), getActivityFeed);

export default router;
