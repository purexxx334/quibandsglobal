import { Router } from 'express';
import { supportController } from '../controllers/supportController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();


// User Live Chat Routes (Requires authentication)
router.get('/me', requireAuth, (req, res, next) => supportController.getMyConversation(req, res, next));
router.post('/messages', requireAuth, (req, res, next) => supportController.sendMessage(req, res, next));
router.post('/mark-read', requireAuth, (req, res, next) => supportController.markRead(req, res, next));

// Admin Live Support Hub Routes (Admin & Moderator only)
router.get('/admin/conversations', requireAuth, requireRole('admin', 'moderator'), (req, res, next) => supportController.adminGetConversations(req, res, next));
router.get('/admin/conversations/:id/messages', requireAuth, requireRole('admin', 'moderator'), (req, res, next) => supportController.adminGetMessages(req, res, next));
router.post('/admin/conversations/:id/messages', requireAuth, requireRole('admin', 'moderator'), (req, res, next) => supportController.adminSendMessage(req, res, next));
router.patch('/admin/conversations/:id/status', requireAuth, requireRole('admin', 'moderator'), (req, res, next) => supportController.adminUpdateStatus(req, res, next));

export default router;
