import { Router } from 'express';
import { profileController } from '../controllers/profileController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All profile endpoints require Supabase Auth token
router.use(requireAuth);

router.get('/', (req, res, next) => profileController.getProfile(req, res, next));
router.put('/', (req, res, next) => profileController.updateProfile(req, res, next));
router.patch('/', (req, res, next) => profileController.updateProfile(req, res, next));

export default router;
