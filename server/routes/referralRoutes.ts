import { Router } from 'express';
import { referralController } from '../controllers/referralController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/me', (req, res, next) => referralController.getMyReferralData(req, res, next));
router.post('/link', (req, res, next) => referralController.linkReferral(req, res, next));

export default router;
