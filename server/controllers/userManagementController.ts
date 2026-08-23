import { Response, NextFunction } from 'express';
import { userManagementService } from '../services/userManagementService';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class UserManagementController {
  /**
   * GET /api/admin/users/:userId/dossier (Admin)
   */
  async getUserDossier(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { userId } = req.params;
      const dossier = await userManagementService.getUserDossier(userId);
      res.status(200).json({
        success: true,
        data: dossier,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/users/:userId/suspend (Admin)
   */
  async suspendAccount(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminId = req.user!.id;

      await userManagementService.suspendAccount(userId, adminId, reason || 'Account suspended by administrator.');

      res.status(200).json({
        success: true,
        message: 'User account suspended and active sessions revoked.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/users/:userId/reactivate (Admin)
   */
  async reactivateAccount(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminId = req.user!.id;

      await userManagementService.reactivateAccount(userId, adminId, reason || 'Account reactivated by administrator.');

      res.status(200).json({
        success: true,
        message: 'User account reactivated successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/users/:userId/flag (Admin)
   */
  async flagAccount(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { isFlagged, flagReason } = req.body;
      const adminId = req.user!.id;

      await userManagementService.setAccountFlag(
        userId,
        Boolean(isFlagged),
        flagReason || 'Flagged for security review',
        adminId
      );

      res.status(200).json({
        success: true,
        message: `Account ${isFlagged ? 'flagged for investigation' : 'unflagged'} successfully.`,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/users/:userId/revoke-sessions (Admin)
   */
  async revokeSessions(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminId = req.user!.id;

      await userManagementService.forceRevokeSessions(userId, adminId, reason || 'Force logout executed by administrator.');

      res.status(200).json({
        success: true,
        message: 'All active sessions for this user have been terminated.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/users/:userId/reset-password (Admin)
   */
  async triggerPasswordReset(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user!.id;

      const resetLink = await userManagementService.generatePasswordResetLink(userId, adminId);

      res.status(200).json({
        success: true,
        message: 'Password reset action generated.',
        data: { resetLink },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/users/:userId/set-password (Admin)
   */
  async directSetPassword(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      const adminId = req.user!.id;

      if (!newPassword || newPassword.length < 8) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long.',
        });
        return;
      }

      await userManagementService.directSetPassword(userId, newPassword, adminId);

      res.status(200).json({
        success: true,
        message: 'User password updated successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/users/:userId/send-reset-email (Admin)
   */
  async sendResetEmail(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user!.id;

      await userManagementService.sendPasswordResetEmail(userId, adminId);

      res.status(200).json({
        success: true,
        message: 'Password reset link sent directly to user email address.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/admin/users/:userId/terminate (Admin)
   */
  async terminateAccount(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { reason } = req.body || {};
      const adminId = req.user!.id;

      await userManagementService.terminateAccount(userId, adminId, reason || 'Account terminated by administrator.');

      res.status(200).json({
        success: true,
        message: 'User account terminated and permanently purged.',
      });
    } catch (err) {
      next(err);
    }
  }


  /**
   * POST /api/admin/users/:userId/adjust-balance (Admin)
   */
  async adjustBalance(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { currency, amount, adjustmentType, reason } = req.body;
      const adminId = req.user!.id;

      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        res.status(400).json({
          success: false,
          error: 'A valid positive adjustment amount is required.',
        });
        return;
      }

      if (!reason || reason.trim().length < 5) {
        res.status(400).json({
          success: false,
          error: 'A detailed audit reason (at least 5 characters) is required for financial adjustments.',
        });
        return;
      }

      const updatedWallet = await userManagementService.adjustUserBalance({
        userId,
        currency: currency || 'USD',
        amount: Number(amount),
        adjustmentType: adjustmentType === 'debit' ? 'debit' : 'credit',
        reason,
        adminId,
      });

      res.status(200).json({
        success: true,
        message: 'Financial balance adjustment processed and recorded in ledger.',
        data: updatedWallet,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const userManagementController = new UserManagementController();
