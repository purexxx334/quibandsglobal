import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { depositController } from '../controllers/depositController';

const router = Router();

// All deposit routes require authenticated user
router.use(requireAuth);

router.post('/', depositController.createDeposit);
router.get('/', depositController.getUserDeposits);
router.get('/:id', depositController.getDepositById);

export default router;
