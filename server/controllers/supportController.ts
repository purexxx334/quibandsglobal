import { Response, NextFunction } from 'express';
import { supportService } from '../services/supportService';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class SupportController {
  /**
   * GET /api/support/me - Get current user's conversation & messages
   */
  async getMyConversation(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const user = req.user!;
      const conv = await supportService.getOrCreateUserConversation(
        user.id,
        user.email,
        user.profile?.full_name || user.email.split('@')[0]
      );
      const messages = await supportService.getConversationMessages(conv.id);

      res.status(200).json({
        success: true,
        data: {
          conversation: conv,
          messages,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/support/messages - Send message as current user
   */
  async sendMessage(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const user = req.user!;
      const { message } = req.body;

      if (!message || !message.trim()) {
        res.status(400).json({
          success: false,
          error: 'Message content cannot be empty.',
        });
        return;
      }

      const result = await supportService.sendUserMessage(
        user.id,
        user.email,
        user.profile?.full_name || user.email.split('@')[0],
        message
      );

      res.status(201).json({
        success: true,
        message: 'Message dispatched successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/support/mark-read - User marks messages as read
   */
  async markRead(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const user = req.user!;
      const { conversationId } = req.body;

      if (conversationId) {
        await supportService.markMessagesRead(conversationId, 'USER');
      }

      res.status(200).json({
        success: true,
        message: 'Conversation marked as read.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/support/conversations - List all support conversations
   */
  async adminGetConversations(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const conversations = await supportService.getAllConversations();
      res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/support/conversations/:id/messages - Get messages in a conversation
   */
  async adminGetMessages(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;
      const messages = await supportService.getConversationMessages(id);
      
      // Auto-mark read for admin
      await supportService.markMessagesRead(id, 'ADMIN');

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/support/conversations/:id/messages - Admin sends reply
   */
  async adminSendMessage(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const admin = req.user!;
      const { id } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
        res.status(400).json({
          success: false,
          error: 'Reply message cannot be empty.',
        });
        return;
      }

      const adminMsg = await supportService.sendAdminMessage(
        admin.id,
        admin.profile?.full_name || 'Senior Support Specialist',
        id,
        message
      );

      res.status(201).json({
        success: true,
        message: 'Reply sent to user.',
        data: adminMsg,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/support/conversations/:id/status - Update status or toggle bot
   */
  async adminUpdateStatus(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, isBotActive } = req.body;

      const updated = await supportService.updateConversationStatus(id, status, isBotActive);

      res.status(200).json({
        success: true,
        message: 'Support conversation updated.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const supportController = new SupportController();
