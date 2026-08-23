import { Router } from 'express';
import { depositAddressController } from '../controllers/depositAddressController';

const router = Router();

// Public / User route to get active deposit addresses
router.get('/active', (req, res, next) => depositAddressController.getActiveAddresses(req, res, next));

export default router;
