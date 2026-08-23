import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { userManagementController } from '../controllers/userManagementController';
import { securityController } from '../controllers/securityController';
import { depositAddressController } from '../controllers/depositAddressController';
import { depositController } from '../controllers/depositController';
import { withdrawalController } from '../controllers/withdrawalController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

// Protect ALL admin routes with Auth + Admin Role check
router.use(requireAuth, requireRole('admin'));

// 1. User Directory & Roles
router.get('/users', (req, res, next) => adminController.getAllUsers(req, res, next));
router.post('/users/:userId/role', (req, res, next) => adminController.setUserRole(req, res, next));
router.post('/users/:userId/financial-balances', (req, res, next) => adminController.editUserFinancialBalances(req, res, next));

// 2. Comprehensive User Dossier & Account Lifecycle
router.get('/users/:userId/dossier', (req, res, next) => userManagementController.getUserDossier(req, res, next));
router.post('/users/:userId/suspend', (req, res, next) => userManagementController.suspendAccount(req, res, next));
router.post('/users/:userId/reactivate', (req, res, next) => userManagementController.reactivateAccount(req, res, next));
router.post('/users/:userId/flag', (req, res, next) => userManagementController.flagAccount(req, res, next));
router.post('/users/:userId/revoke-sessions', (req, res, next) => userManagementController.revokeSessions(req, res, next));
router.post('/users/:userId/force-logout', (req, res, next) => userManagementController.revokeSessions(req, res, next));
router.post('/users/:userId/reset-password', (req, res, next) => userManagementController.triggerPasswordReset(req, res, next));
router.post('/users/:userId/send-reset-email', (req, res, next) => userManagementController.sendResetEmail(req, res, next));
router.post('/users/:userId/set-password', (req, res, next) => userManagementController.directSetPassword(req, res, next));
router.delete('/users/:userId', (req, res, next) => userManagementController.terminateAccount(req, res, next));
router.delete('/users/:userId/terminate', (req, res, next) => userManagementController.terminateAccount(req, res, next));
router.post('/users/:userId/adjust-balance', (req, res, next) => userManagementController.adjustBalance(req, res, next));

// 3. System Settings (Gas Fee Address, Upgrade Address, Receive Limit)
router.get('/settings', (req, res, next) => adminController.getSettings(req, res, next));
router.post('/settings', (req, res, next) => adminController.updateSetting(req, res, next));

// 4. Security Telemetry & Notification Alerts
router.get('/security/logs', (req, res, next) => securityController.getSecurityLogs(req, res, next));
router.get('/security/notifications', (req, res, next) => securityController.getNotifications(req, res, next));
router.patch('/security/notifications/:id/read', (req, res, next) => securityController.markNotificationRead(req, res, next));
router.post('/security/notifications/read-all', (req, res, next) => securityController.markAllNotificationsRead(req, res, next));

// 5. Deposit Address & Treasury Management
router.get('/deposit-addresses', (req, res, next) => depositAddressController.getAllAddresses(req, res, next));
router.post('/deposit-addresses', (req, res, next) => depositAddressController.setDepositAddress(req, res, next));
router.put('/deposit-addresses/:id', (req, res, next) => depositAddressController.updateAddressById(req, res, next));
router.patch('/deposit-addresses/:id/toggle', (req, res, next) => depositAddressController.toggleActive(req, res, next));

router.get('/deposit-addresses/history', (req, res, next) => depositAddressController.getAddressHistory(req, res, next));

// 6. Deposit Request Review & Approval Lifecycle
router.get('/deposits', (req, res, next) => depositController.getAdminDeposits(req, res, next));
router.get('/deposits/:id', (req, res, next) => depositController.getAdminDepositById(req, res, next));
router.post('/deposits/:id/approve', (req, res, next) => depositController.approveDeposit(req, res, next));
router.post('/deposits/:id/reject', (req, res, next) => depositController.rejectDeposit(req, res, next));

// 7. Withdrawal Request Review & Approval Lifecycle
router.get('/withdrawals', (req, res, next) => withdrawalController.getAdminWithdrawals(req, res, next));
router.get('/withdrawals/:id', (req, res, next) => withdrawalController.getWithdrawalById(req, res, next));
router.post('/withdrawals/:id/review-gas-fee', (req, res, next) => withdrawalController.reviewGasFee(req, res, next));

// 8. KYC Compliance & Identity Review
router.get('/kyc', (req, res, next) => adminController.getKycSubmissions(req, res, next));
router.post('/kyc/:id/review', (req, res, next) => adminController.reviewKycSubmission(req, res, next));

export default router;

