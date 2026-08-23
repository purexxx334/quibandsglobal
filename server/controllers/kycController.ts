import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { kycService } from '../services/kycService';

export class KycController {
  /**
   * GET /api/kyc/me
   * Get current user's active KYC submission
   */
  async getMyKyc(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const submission = await kycService.getUserKyc(req.user.id);
      return res.status(200).json({
        success: true,
        data: submission,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/kyc/submit
   * Submit KYC credentials & photos
   */
  async submitKyc(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const {
        documentType,
        documentNumber,
        firstName,
        lastName,
        dob,
        country,
        address,
        city,
        postalCode,
        idFrontUrl,
        idBackUrl,
        selfieUrl,
      } = req.body;

      if (!documentType || !documentNumber || !firstName || !lastName || !dob || !country || !address || !idFrontUrl || !selfieUrl) {
        return res.status(400).json({
          success: false,
          error: 'Please complete all required fields and upload both ID front and selfie photos.',
        });
      }

      const submission = await kycService.submitKyc(req.user.id, {
        documentType,
        documentNumber,
        firstName,
        lastName,
        dob,
        country,
        address,
        city,
        postalCode,
        idFrontUrl,
        idBackUrl,
        selfieUrl,
      });

      return res.status(201).json({
        success: true,
        message: 'KYC credentials submitted successfully for compliance verification.',
        data: submission,
      });
    } catch (err) {
      return next(err);
    }
  }
}

export const kycController = new KycController();
