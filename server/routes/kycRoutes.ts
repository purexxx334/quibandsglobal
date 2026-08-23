import { Router } from 'express';
import { kycController } from '../controllers/kycController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/me', (req, res, next) => kycController.getMyKyc(req, res, next));
router.post('/submit', (req, res, next) => kycController.submitKyc(req, res, next));

export default router;
