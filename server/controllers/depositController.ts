import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse, DepositRequestStatus } from '../types';
import { depositService } from '../services/depositService';

export class DepositController {
  /**
   * POST /api/deposits
   * Authenticated user creates a new deposit request
   */
  async createDeposit(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.id; // Derived from verified JWT
      const { asset, network, amount, transactionHash, proofReference, metadata } = req.body;

      const deposit = await depositService.createDepositRequest({
        userId,
        asset,
        network,
        amount: Number(amount),
        transactionHash,
        proofReference,
        metadata,
      });

      return res.status(201).json({
        success: true,
        message: 'Deposit request submitted successfully. Awaiting administrative review.',
        data: deposit,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to submit deposit request.',
      });
    }
  }

  /**
   * GET /api/deposits
   * Returns deposit requests belonging strictly to the authenticated user
   */
  async getUserDeposits(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const deposits = await depositService.getUserDeposits(userId);

      return res.status(200).json({
        success: true,
        data: deposits,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch deposits.',
      });
    }
  }

  /**
   * GET /api/deposits/:id
   * Returns a single deposit request with strict ownership check
   */
  async getDepositById(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user?.role === 'admin';
      const { id } = req.params;

      const deposit = await depositService.getDepositById(id, userId, isAdmin);

      return res.status(200).json({
        success: true,
        data: deposit,
      });
    } catch (err: any) {
      const status = err.message.includes('Access denied') ? 403 : 404;
      return res.status(status).json({
        success: false,
        error: err.message || 'Deposit not found.',
      });
    }
  }

  /**
   * GET /api/admin/deposits
   * Protected: Admin role required
   * Returns all deposit requests across the platform
   */
  async getAdminDeposits(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const status = req.query.status as DepositRequestStatus | undefined;
      const deposits = await depositService.getAdminDeposits(status);

      return res.status(200).json({
        success: true,
        data: deposits,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch admin deposits.',
      });
    }
  }

  /**
   * GET /api/admin/deposits/:id
   * Protected: Admin role required
   */
  async getAdminDepositById(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;
      const deposit = await depositService.getDepositById(id, req.user!.id, true);

      return res.status(200).json({
        success: true,
        data: deposit,
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        error: err.message || 'Deposit request not found.',
      });
    }
  }

  /**
   * POST /api/admin/deposits/:id/approve
   * Protected: Admin role required
   * Atomically approves deposit and credits user wallet
   */
  async approveDeposit(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      const result = await depositService.approveDeposit(id, adminId);

      return res.status(200).json({
        success: true,
        message: 'Deposit request approved and wallet successfully credited.',
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to approve deposit request.',
      });
    }
  }

  /**
   * POST /api/admin/deposits/:id/reject
   * Protected: Admin role required
   * Rejects deposit request with mandatory reason
   */
  async rejectDeposit(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          error: 'A rejection reason is required.',
        });
      }

      const result = await depositService.rejectDeposit(id, adminId, reason);

      return res.status(200).json({
        success: true,
        message: 'Deposit request rejected.',
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to reject deposit request.',
      });
    }
  }

  /**
   * GET /api/notifications
   * Returns in-app notifications for authenticated user
   */
  async getUserNotifications(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const notifications = await depositService.getUserNotifications(userId);

      return res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  async markNotificationRead(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await depositService.markNotificationRead(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }
}

export const depositController = new DepositController();
