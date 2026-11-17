import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';
import { Logger } from '../utils/logger.js';
import { RoleName } from '../types/db.types.js';

// =============================================================================
// RBAC Middleware
// Authorizes requests based on assigned roles and granular permissions
// =============================================================================

export const requireRole = (...allowedRoles: RoleName[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Step 1: Check if userContext is populated by requireAuth
    if (!req.userContext) {
      Logger.warn('[requireRole] Attempted role check without prior requireAuth middleware execution');
      ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
      return;
    }

    const currentRole = req.userContext.role;
    Logger.debug(`[requireRole] Checking role: User="${req.userContext.id}", Role="${currentRole}", Allowed=[${allowedRoles.join(', ')}]`);

    // Step 2: Validate current user role against allowed list
    if (!allowedRoles.includes(currentRole)) {
      Logger.warn(
        `[requireRole] Access denied: User ${req.userContext.id} with role "${currentRole}" attempted access requiring [${allowedRoles.join(', ')}]`
      );
      ApiResponse.error(
        res,
        `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
        'FORBIDDEN_ROLE',
        403
      );
      return;
    }

    Logger.info(`[requireRole] Role authorized: "${currentRole}" for path ${req.path}`);
    next();
  };
};

export const requirePermission = (resource: string, action: string) => {
  const requiredPermName = `${resource}:${action}`;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Step 1: Ensure authentication context exists
    if (!req.userContext) {
      Logger.warn('[requirePermission] Attempted permission check without requireAuth');
      ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
      return;
    }

    // Step 2: Admins automatically satisfy all organization-level CRM permissions
    if (req.userContext.role === 'ADMIN') {
      Logger.debug(`[requirePermission] Admin bypass granted for permission "${requiredPermName}"`);
      next();
      return;
    }

    // Step 3: Check granular permissions array
    const userPermissions = req.userContext.permissions || [];
    const hasPermission = userPermissions.includes(requiredPermName);

    Logger.debug(`[requirePermission] Checking permission "${requiredPermName}" against user permissions [${userPermissions.length} items]`);

    if (!hasPermission) {
      Logger.warn(
        `[requirePermission] Access denied: User ${req.userContext.id} lacks required permission "${requiredPermName}"`
      );
      ApiResponse.error(
        res,
        `Permission denied. Missing required privilege: "${requiredPermName}"`,
        'FORBIDDEN_PERMISSION',
        403
      );
      return;
    }

    Logger.info(`[requirePermission] Permission "${requiredPermName}" validated for path ${req.path}`);
    next();
  };
};
