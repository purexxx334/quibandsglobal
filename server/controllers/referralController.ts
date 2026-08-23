import { Response, NextFunction } from 'express';
import { referralService } from '../services/referralService';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class ReferralController {
  /**
   * GET /api/referrals/me
   */
  async getMyReferralData(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await referralService.getReferralData(userId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/referrals/link
   */
  async linkReferral(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { referralCode } = req.body;

      if (!referralCode) {
        res.status(400).json({
          success: false,
          error: 'Referral code is required.',
        });
        return;
      }

      await referralService.linkReferral(userId, referralCode);

      res.status(200).json({
        success: true,
        message: 'Referral linked successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const referralController = new ReferralController();
