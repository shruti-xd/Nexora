import { Router } from 'express';
import { AccountsController } from './accounts.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { createAccountSchema, updateAccountSchema, accountQuerySchema } from './accounts.validators.js';
import { userIdParamSchema } from '../users/users.validators.js';

// =============================================================================
// Accounts Routes
// Endpoints for Accounts Management (Module 02)
// =============================================================================

const router = Router();

// Apply authentication middleware to all account routes
router.use(requireAuth);

// Step 1: Create Account
router.post(
  '/',
  requirePermission('accounts', 'create'),
  validateRequest(createAccountSchema, 'body'),
  AccountsController.create
);

// Step 2: List Accounts (Search, Filter, Pagination)
router.get(
  '/',
  requirePermission('accounts', 'read'),
  validateRequest(accountQuerySchema, 'query'),
  AccountsController.list
);

// Step 3: Get Account By ID
router.get(
  '/:id',
  requirePermission('accounts', 'read'),
  validateRequest(userIdParamSchema, 'params'),
  AccountsController.getById
);

// Step 4: Update Account By ID
router.patch(
  '/:id',
  requirePermission('accounts', 'update'),
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(updateAccountSchema, 'body'),
  AccountsController.update
);

// Step 5: Soft Delete Account By ID
router.delete(
  '/:id',
  requirePermission('accounts', 'delete'),
  validateRequest(userIdParamSchema, 'params'),
  AccountsController.delete
);

// Step 6: Get Associated Contacts for an Account
router.get(
  '/:id/contacts',
  requirePermission('contacts', 'read'),
  validateRequest(userIdParamSchema, 'params'),
  AccountsController.getContacts
);

export const accountRoutes = router;
