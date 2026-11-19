import { Router } from 'express';
import { ContactsController } from './contacts.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { createContactSchema, updateContactSchema, contactQuerySchema } from './contacts.validators.js';
import { userIdParamSchema } from '../users/users.validators.js';

// =============================================================================
// Contacts Routes
// Endpoints for Contacts Management (Module 02)
// =============================================================================

const router = Router();

// Apply authentication middleware to all contact routes
router.use(requireAuth);

// Step 1: Create Contact
router.post(
  '/',
  requirePermission('contacts', 'create'),
  validateRequest(createContactSchema, 'body'),
  ContactsController.create
);

// Step 2: List Contacts (Search, Filter, Pagination)
router.get(
  '/',
  requirePermission('contacts', 'read'),
  validateRequest(contactQuerySchema, 'query'),
  ContactsController.list
);

// Step 3: Get Contact By ID
router.get(
  '/:id',
  requirePermission('contacts', 'read'),
  validateRequest(userIdParamSchema, 'params'),
  ContactsController.getById
);

// Step 4: Update Contact By ID
router.patch(
  '/:id',
  requirePermission('contacts', 'update'),
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(updateContactSchema, 'body'),
  ContactsController.update
);

// Step 5: Soft Delete Contact By ID
router.delete(
  '/:id',
  requirePermission('contacts', 'delete'),
  validateRequest(userIdParamSchema, 'params'),
  ContactsController.delete
);

export const contactRoutes = router;
