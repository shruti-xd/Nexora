import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requirePermission, requireRole } from '../../middleware/rbac.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  getUsersQuerySchema,
  userIdParamSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from './users.validators.js';

// =============================================================================
// Users Routes
// Endpoints for listing members, viewing profiles, and managing roles/status
// =============================================================================

const router = Router();

// Step 1: List organization members (Requires users:read permission)
router.get(
  '/',
  requireAuth,
  requirePermission('users', 'read'),
  validateRequest(getUsersQuerySchema, 'query'),
  UsersController.listMembers
);

// Step 2: Get single organization member (Requires users:read permission)
router.get(
  '/:id',
  requireAuth,
  requirePermission('users', 'read'),
  validateRequest(userIdParamSchema, 'params'),
  UsersController.getMemberById
);

// Step 3: Update member role (Requires ADMIN role and users:update_role permission)
router.patch(
  '/:id/role',
  requireAuth,
  requireRole('ADMIN'),
  requirePermission('users', 'update_role'),
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(updateUserRoleSchema, 'body'),
  UsersController.updateMemberRole
);

// Step 4: Update member active/inactive status (Requires ADMIN role and users:update_status permission)
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('ADMIN'),
  requirePermission('users', 'update_status'),
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(updateUserStatusSchema, 'body'),
  UsersController.updateMemberStatus
);

export const userRoutes = router;
