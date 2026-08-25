import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { profileService } from '../services/profileService';

export class ProfileController {
  /**
   * GET /api/profile
   * Returns current user's profile and database role
   */
  async getProfile(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const profile = await profileService.getProfile(req.user);

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /api/profile
   * Updates current user's profile metadata
   */
  async updateProfile(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { full_name, username, avatar_url, phone_number, country, address, city, postal_code, dob, bank_details } = req.body;
      const updated = await profileService.updateProfile(req.user.id, {
        full_name,
        username,
        avatar_url,
        phone_number,
        country,
        address,
        city,
        postal_code,
        dob,
        bank_details,
      });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updated,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/profile/sync-mining
   * Syncs current user's live mining balance and main balance
   */
  async syncMining(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { mining_balance } = req.body;
      const result = await profileService.syncMiningState(req.user.id, Number(mining_balance || 0));

      return res.status(200).json({
        success: true,
        message: 'Mining state synchronized successfully',
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  }

}

export const profileController = new ProfileController();
