import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole, ApiResponse } from '../types';

/**
 * Role Authorization Middleware
 * Enforces that req.user has one of the allowed roles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Authentication required.',
      });
    }

    const currentRole = req.user.role;

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden. Requires ${allowedRoles.join(' or ')} privileges. Your role is '${currentRole}'.`,
      });
    }

    return next();
  };
}
