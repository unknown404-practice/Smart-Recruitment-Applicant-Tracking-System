import { Router } from 'express';
import { authenticateFirebase, requireRole } from '../middleware/authMiddleware';
import { getActivityFeed, getActivityTypes } from '../controllers/activityController';

const router = Router();

// Protect all /api/activity routes with Firebase authentication
router.use(authenticateFirebase);

/**
 * GET /api/activity/types
 * Returns registered activity event types taxonomy.
 */
router.get('/types', getActivityTypes);

/**
 * GET /api/activity
 * Unified system activity feed aggregating cross-workflow events.
 * Accessible to ADMIN and HR users with corporate tenant boundaries.
 */
router.get('/', requireRole(['ADMIN', 'SUPER_ADMIN', 'HR', 'RECRUITER']), getActivityFeed);

export default router;
