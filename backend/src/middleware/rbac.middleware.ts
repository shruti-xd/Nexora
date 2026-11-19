import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';
import { Logger } from '../utils/logger.js';
import { RoleName } from '../types/db.types.js';

// =============================================================================
// RBAC Middleware
// Authorizes requests based on Platform Admin status, assigned roles, and granular permissions
// =============================================================================

// Step 1: Require Platform Administrator privileges
export const requirePlatformAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.userContext) {
    Logger.warn('[requirePlatformAdmin] Attempted check without requireAuth');
    ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
    return;
  }

  if (!req.userContext.isPlatformAdmin) {
    Logger.warn(`[requirePlatformAdmin] Access denied: User ${req.userContext.id} is not a Platform Admin`);
    ApiResponse.error(
      res,
      'Access denied. Platform Administrator privileges are required.',
      'FORBIDDEN_PLATFORM_ADMIN',
      403
    );
    return;
  }

  Logger.info(`[requirePlatformAdmin] Platform Admin authorized: ${req.userContext.id}`);
  next();
};

// Step 2: Require specific Organization Role (ADMIN, MANAGER, SALES_REP, VIEWER)
export const requireRole = (...allowedRoles: RoleName[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userContext) {
      Logger.warn('[requireRole] Attempted role check without prior requireAuth middleware execution');
      ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
      return;
    }

    const currentRole = req.userContext.role;
    Logger.debug(`[requireRole] Checking role: User="${req.userContext.id}", Role="${currentRole}", Allowed=[${allowedRoles.join(', ')}]`);

    if (!currentRole || !allowedRoles.includes(currentRole)) {
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

// Step 3: Require granular Organization Permission
export const requirePermission = (resource: string, action: string) => {
  const requiredPermName = `${resource}:${action}`;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userContext) {
      Logger.warn('[requirePermission] Attempted permission check without requireAuth');
      ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
      return;
    }

    // Admins automatically satisfy all organization-level CRM permissions
    if (req.userContext.role === 'ADMIN') {
      Logger.debug(`[requirePermission] Admin bypass granted for permission "${requiredPermName}"`);
      next();
      return;
    }

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
