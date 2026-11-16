import { Router } from 'express';
import { authenticateFirebase } from '../middleware/authMiddleware';
import {
  getMyOnboardingTasks,
  updateOnboardingTask,
} from '../controllers/onboardingController';

const router = Router();

router.use(authenticateFirebase);

router.get('/', getMyOnboardingTasks);
router.patch('/:id', updateOnboardingTask);

export default router;
