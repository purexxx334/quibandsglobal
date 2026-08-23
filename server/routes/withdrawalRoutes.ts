import { Router } from 'express';
import { withdrawalController } from '../controllers/withdrawalController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public / Authenticated route to get active gas fee and upgrade addresses
router.get('/settings', (req, res, next) => withdrawalController.getSettings(req, res, next));

// Protected user routes
router.use(requireAuth);

router.post('/', (req, res, next) => withdrawalController.createWithdrawal(req, res, next));
router.get('/', (req, res, next) => withdrawalController.getUserWithdrawals(req, res, next));
router.get('/:id', (req, res, next) => withdrawalController.getWithdrawalById(req, res, next));
router.post('/:id/upgrade-proof', (req, res, next) => withdrawalController.submitTierUpgradeProof(req, res, next));

export default router;
