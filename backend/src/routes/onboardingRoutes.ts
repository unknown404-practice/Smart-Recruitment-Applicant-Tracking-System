import { Router } from 'express';
import { authenticateFirebase } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  getOnboardingTasks,
  toggleOnboardingTask,
  toggleTaskSchema,
} from '../controllers/onboardingController';

const router = Router();

// Protect all /api/onboarding routes with Firebase authentication
router.use(authenticateFirebase);

/**
 * GET /api/onboarding/me
 * Retrieves onboarding tasks for authenticated candidate.
 */
router.get('/me', getOnboardingTasks);

/**
 * GET /api/onboarding
 * Retrieves onboarding tasks (filterable by candidate_id or application_id).
 */
router.get('/', getOnboardingTasks);

/**
 * GET /api/onboarding/:applicationId
 * Retrieves onboarding tasks for a specific application.
 */
router.get('/:applicationId', getOnboardingTasks);

/**
 * PATCH /api/onboarding/:id
 * Toggles onboarding task completion status.
 */
router.patch(
  '/:id',
  validateRequest({ body: toggleTaskSchema }),
  toggleOnboardingTask
);

/**
 * PUT /api/onboarding/:id
 * Toggles onboarding task completion status (alias).
 */
router.put(
  '/:id',
  validateRequest({ body: toggleTaskSchema }),
  toggleOnboardingTask
);

export default router;
