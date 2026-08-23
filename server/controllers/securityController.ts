import { Request, Response, NextFunction } from 'express';
import { securityService } from '../services/securityService';
import { notificationService } from '../services/notificationService';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class SecurityController {
  /**
   * POST /api/security/telemetry (Record login or auth attempt telemetry)
   */
  async recordAuthTelemetry(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { userId, userEmail, eventType, status, sessionId, authMethod, details } = req.body;

      if (!eventType) {
        res.status(400).json({ success: false, error: 'eventType is required.' });
        return;
      }

      const log = await securityService.recordSecurityEvent({
        userId,
        userEmail,
        eventType,
        status: status || 'success',
        req,
        sessionId,
        authMethod,
        details,
      });

      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/security/logs (Admin)
   */
  async getSecurityLogs(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;
      const eventType = req.query.eventType ? String(req.query.eventType) : undefined;

      const logs = await securityService.getSecurityLogs(limit, eventType);
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/security/notifications (Admin)
   */
  async getNotifications(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
      const unreadOnly = req.query.unread === 'true';

      const notifications = await notificationService.getNotifications(limit, unreadOnly);
      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/security/notifications/:id/read (Admin)
   */
  async markNotificationRead(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;
      await notificationService.markAsRead(id);
      res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/security/notifications/read-all (Admin)
   */
  async markAllNotificationsRead(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      await notificationService.markAllAsRead();
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const securityController = new SecurityController();
