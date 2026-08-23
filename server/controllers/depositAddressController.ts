import { Request, Response, NextFunction } from 'express';
import { depositAddressService } from '../services/depositAddressService';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class DepositAddressController {
  /**
   * GET /api/deposit-addresses/active (Public / Authenticated User)
   */
  async getActiveAddresses(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const addresses = await depositAddressService.getActiveAddresses();
      res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/deposit-addresses (Admin)
   */
  async getAllAddresses(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const addresses = await depositAddressService.getAllAddresses();
      res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/deposit-addresses (Admin)
   */
  async setDepositAddress(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { asset, network, address, memoTag, notes, reason, setAsActive } = req.body;

      if (!asset || !network || !address) {
        res.status(400).json({
          success: false,
          error: 'Asset, network, and address are required.',
        });
        return;
      }

      const adminId = req.user!.id;
      const result = await depositAddressService.setDepositAddress({
        asset,
        network,
        address,
        memoTag,
        notes,
        reason: reason || 'Address updated by administrator',
        setAsActive: setAsActive !== false,
        adminId,
      });

      res.status(201).json({
        success: true,
        message: 'Deposit address configured successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/deposit-addresses/:id (Admin)
   */
  async updateAddressById(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;
      const { asset, network, address, memoTag, notes, isActive, reason } = req.body;

      if (!address || !address.trim()) {
        res.status(400).json({
          success: false,
          error: 'Valid destination address string is required.',
        });
        return;
      }

      const adminId = req.user!.id;
      const result = await depositAddressService.updateAddressById(
        id,
        {
          asset,
          network,
          address,
          memoTag,
          notes,
          isActive,
          reason: reason || 'Deposit address updated by administrator',
        },
        adminId
      );

      res.status(200).json({
        success: true,
        message: 'Deposit address updated successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }


  /**
   * PATCH /api/admin/deposit-addresses/:id/toggle (Admin)
   */
  async toggleActive(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive, reason } = req.body;

      if (typeof isActive !== 'boolean') {
        res.status(400).json({
          success: false,
          error: 'isActive boolean flag is required.',
        });
        return;
      }

      const adminId = req.user!.id;
      const result = await depositAddressService.toggleActive(
        id,
        isActive,
        adminId,
        reason || 'Status toggled by administrator'
      );

      res.status(200).json({
        success: true,
        message: `Address ${isActive ? 'activated' : 'deactivated'} successfully.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/deposit-addresses/history (Admin)
   */
  async getAddressHistory(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { addressId } = req.query;
      const history = await depositAddressService.getAddressHistory(
        addressId ? String(addressId) : undefined
      );

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const depositAddressController = new DepositAddressController();
