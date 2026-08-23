import { Router } from 'express';
import { transactionController } from '../controllers/transactionController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/transactions/me
router.get('/me', requireAuth, (req, res, next) => transactionController.getMyTransactions(req, res, next));

export default router;
