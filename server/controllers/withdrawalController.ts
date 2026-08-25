import { Response, NextFunction } from 'express';
import { WithdrawalService } from '../services/withdrawalService';
import { AuthenticatedRequest, ApiResponse } from '../types';

const withdrawalService = new WithdrawalService();

export class WithdrawalController {
  /**
   * POST /api/withdrawals (Authenticated User)
   */
  async createWithdrawal(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const {
        asset,
        network,
        amount,
        localCurrency,
        conversionRate,
        convertedAmount,
        payoutMethod,
        bankDetails,
        hbcVbcCode,
        gasFeeTxHash,
        metadata,
      } = req.body;

      const destinationWalletAddress =
        req.body.destinationWalletAddress ||
        req.body.destinationAddress ||
        req.body.destination_wallet_address ||
        (bankDetails?.account_number ? `Bank: ${bankDetails.bank_name || ''} - ${bankDetails.account_number}` : 'Crypto Destination');

      if (!asset || !network) {
        res.status(400).json({ success: false, error: 'Asset and network are required.' });
        return;
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ success: false, error: 'A positive numerical withdrawal amount is required.' });
        return;
      }

      const withdrawal = await withdrawalService.createWithdrawalRequest({
        userId: req.user.id,
        asset,
        network,
        destinationWalletAddress,
        amount: numAmount,
        localCurrency,
        conversionRate: Number(conversionRate) || 1.0,
        convertedAmount: Number(convertedAmount) || numAmount,
        payoutMethod,
        bankDetails,
        hbcVbcCode,
        gasFeeTxHash,
        metadata,
      });

      res.status(201).json({
        success: true,
        message: 'Withdrawal request created and gas fee payment submitted for review.',
        data: withdrawal,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to create withdrawal request.',
      });
    }
  }

  /**
   * GET /api/withdrawals/settings (Public / Authenticated)
   */
  async getSettings(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const settings = await withdrawalService.getWithdrawalSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch withdrawal settings.',
      });
    }
  }

  /**
   * POST /api/withdrawals/:id/upgrade-proof (Authenticated User)
   */
  async submitTierUpgradeProof(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const id = req.params.id as string;
      const { tier, txHash } = req.body;

      if (!tier || !txHash) {
        res.status(400).json({ success: false, error: 'Tier plan and transaction hash are required.' });
        return;
      }

      const result = await withdrawalService.submitTierUpgradeProof(req.user.id, id, tier, txHash);
      res.status(200).json({
        success: true,
        message: 'Upgrade payment submitted successfully.',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to submit tier upgrade.',
      });
    }
  }

  /**
   * GET /api/withdrawals (Authenticated User)
   */
  async getUserWithdrawals(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const withdrawals = await withdrawalService.getUserWithdrawals(req.user.id);
      res.status(200).json({
        success: true,
        data: withdrawals,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch withdrawals.',
      });
    }
  }

  /**
   * GET /api/withdrawals/:id (Authenticated User)
   */
  async getWithdrawalById(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const id = req.params.id as string;
      const withdrawal = await withdrawalService.getWithdrawalById(id, req.user.id);

      if (!withdrawal) {
        res.status(404).json({ success: false, error: 'Withdrawal request not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        data: withdrawal,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch withdrawal details.',
      });
    }
  }

  /**
   * GET /api/admin/withdrawals (Admin)
   */
  async getAdminWithdrawals(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const statusFilter = req.query.status as string | undefined;
      const withdrawals = await withdrawalService.getAdminWithdrawals(statusFilter);

      res.status(200).json({
        success: true,
        data: withdrawals,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch admin withdrawals.',
      });
    }
  }

  /**
   * POST /api/admin/withdrawals/:id/review-gas-fee (Admin)
   */
  async reviewGasFee(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, error: 'Admin authentication required.' });
        return;
      }

      const id = req.params.id as string;
      const { action, reason } = req.body;

      if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
        res.status(400).json({ success: false, error: 'Action must be APPROVE or REJECT.' });
        return;
      }

      const result = await withdrawalService.reviewGasFeePayment(id, action, req.user.id, reason);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to review gas fee payment.',
      });
    }
  }
}

export { withdrawalService };
export const withdrawalController = new WithdrawalController();
