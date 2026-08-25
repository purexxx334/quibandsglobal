import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { AdminService } from '../services/adminService';
import { SystemSettingsService } from '../services/systemSettingsService';
import { kycService } from '../services/kycService';


const adminService = new AdminService();

export class AdminController {
  /**
   * GET /api/admin/users
   * Protected: Admin role required
   */
  async getAllUsers(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const users = await adminService.getAllUsers();
      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/admin/users/:userId/role
   */
  async setUserRole(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['user', 'admin', 'moderator'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: "Invalid role. Must be 'user', 'admin', or 'moderator'.",
        });
      }

      await adminService.setUserRole(userId, role, req.user!.id);
      return res.status(200).json({
        success: true,
        message: `User role successfully updated to '${role}'.`,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/admin/users/:userId/financial-balances
   * Edit Main Balance, Mining Balance, Profit Balance, Remarks, and Receive Limit
   */
  async editUserFinancialBalances(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const {
        depositBalance,
        mainBalance,
        miningBalance,
        profitBalance,
        convertBalance,
        convertCurrency,
        receiveLimit,
        accountTier,
        depositRemark,
        balanceRemark,
        miningRemark,
        profitRemark,
      } = req.body;

      const result = await adminService.editUserBalancesAndLimits(
        userId,
        {
          depositBalance: depositBalance !== undefined ? Number(depositBalance) : undefined,
          mainBalance: mainBalance !== undefined ? Number(mainBalance) : undefined,
          miningBalance: miningBalance !== undefined ? Number(miningBalance) : undefined,
          profitBalance: profitBalance !== undefined ? Number(profitBalance) : undefined,
          convertBalance: convertBalance !== undefined ? Number(convertBalance) : undefined,
          convertCurrency,
          receiveLimit: receiveLimit !== undefined ? Number(receiveLimit) : undefined,
          accountTier,
          depositRemark,
          balanceRemark,
          miningRemark,
          profitRemark,
        },
        req.user!.id
      );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to update user financial balances.',
      });
    }
  }

  /**
   * GET /api/admin/settings
   */
  async getSettings(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const settings = await SystemSettingsService.getAllSettings();
      return res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch settings.',
      });
    }
  }

  /**
   * POST /api/admin/settings
   */
  async updateSetting(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { key, value, network, description } = req.body;

      if (!key || value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Setting key and value are required.',
        });
      }

      const result = await SystemSettingsService.updateSetting(
        key,
        value,
        network,
        description,
        req.user!.id
      );

      return res.status(200).json({
        success: true,
        message: `Setting '${key}' updated successfully.`,
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to update setting.',
      });
    }
  }
  /**
   * GET /api/admin/kyc
   */
  async getKycSubmissions(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const statusFilter = req.query.status as string;
      const submissions = await kycService.getAllKycSubmissions(statusFilter);
      return res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch KYC submissions.',
      });
    }
  }

  /**
   * POST /api/admin/kyc/:id/review
   */
  async reviewKycSubmission(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;

      if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Valid review status (VERIFIED or REJECTED) is required.',
        });
      }

      if (status === 'REJECTED' && !rejectionReason?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason is required when rejecting KYC.',
        });
      }

      const updated = await kycService.reviewKycSubmission(
        id,
        req.user!.id,
        status,
        rejectionReason
      );

      return res.status(200).json({
        success: true,
        message: `KYC submission marked as ${status}.`,
        data: updated,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to review KYC submission.',
      });
    }
  }
}

export { adminService };
export const adminController = new AdminController();

