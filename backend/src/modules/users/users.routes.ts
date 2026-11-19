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
  inviteUserSchema,
} from './users.validators.js';

// =============================================================================
// Users Routes
// Endpoints for listing members, viewing profiles, role governance, and invites
// =============================================================================

const router = Router();

// Apply requireAuth to all user routes
router.use(requireAuth);

// Step 1: List organization members (Requires users:read permission)
router.get(
  '/',
  requirePermission('users', 'read'),
  validateRequest(getUsersQuerySchema, 'query'),
  UsersController.listMembers
);

// Step 2: Invite new user to organization (Requires ADMIN role or users:invite permission)
router.post(
  '/invite',
  requireRole('ADMIN'),
  requirePermission('users', 'invite'),
  validateRequest(inviteUserSchema, 'body'),
  UsersController.inviteUser
);

// Step 3: Get single organization member (Requires users:read permission)
router.get(
  '/:id',
  requirePermission('users', 'read'),
  validateRequest(userIdParamSchema, 'params'),
  UsersController.getMemberById
);

// Step 4: Resend invitation email (Requires ADMIN role)
router.post(
  '/:id/resend-invitation',
  requireRole('ADMIN'),
  validateRequest(userIdParamSchema, 'params'),
  UsersController.resendInvitation
);

// Step 5: Update member role (Requires ADMIN role and users:update_role permission)
router.patch(
  '/:id/role',
  requireRole('ADMIN'),
  requirePermission('users', 'update_role'),
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(updateUserRoleSchema, 'body'),
  UsersController.updateMemberRole
);

// Step 6: Update member active/inactive status (Requires ADMIN role and users:update_status permission)
router.patch(
  '/:id/status',
  requireRole('ADMIN'),
  requirePermission('users', 'update_status'),
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(updateUserStatusSchema, 'body'),
  UsersController.updateMemberStatus
);

export const userRoutes = router;
