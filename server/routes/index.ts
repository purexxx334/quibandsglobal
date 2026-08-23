import { Router } from 'express';
import healthRoutes from './healthRoutes';
import profileRoutes from './profileRoutes';
import adminRoutes from './adminRoutes';
import depositAddressRoutes from './depositAddressRoutes';
import depositRoutes from './depositRoutes';
import withdrawalRoutes from './withdrawalRoutes';
import kycRoutes from './kycRoutes';
import transactionRoutes from './transactionRoutes';
import referralRoutes from './referralRoutes';
import authRoutes from './authRoutes';
import supportRoutes from './supportRoutes';
import { depositController } from '../controllers/depositController';
import { securityController } from '../controllers/securityController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public & Protected Module Routes
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/deposit-addresses', depositAddressRoutes);
router.use('/deposits', depositRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/kyc', kycRoutes);
router.use('/transactions', transactionRoutes);
router.use('/referrals', referralRoutes);
router.use('/support', supportRoutes);






// In-App User Notifications
router.get('/notifications', requireAuth, (req, res, next) => depositController.getUserNotifications(req, res, next));
router.patch('/notifications/:id/read', requireAuth, (req, res, next) => depositController.markNotificationRead(req, res, next));

// Auth Telemetry logging endpoint
router.post('/security/telemetry', (req, res, next) => securityController.recordAuthTelemetry(req, res, next));

export default router;
