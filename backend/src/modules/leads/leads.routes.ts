import { Router } from 'express';
import { LeadsController } from './leads.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { createLeadSchema, updateLeadSchema, leadQuerySchema, convertLeadSchema } from './leads.validators.js';
import { userIdParamSchema } from '../users/users.validators.js';

// =============================================================================
// Leads Routes
// Endpoints for Leads Management & Conversion (Module 02)
// =============================================================================

const router = Router();

// Apply authentication middleware to all lead routes
router.use(requireAuth);

// Step 1: Create Lead
router.post(
  '/',
  requirePermission('leads', 'create'),
  validateRequest(createLeadSchema, 'body'),
  LeadsController.create
);

// Step 2: List Leads (Search, Filter, Pagination)
router.get(
  '/',
  requirePermission('leads', 'read'),
  validateRequest(leadQuerySchema, 'query'),
  LeadsController.list
);

// Step 3: Get Lead By ID
router.get(
  '/:id',
  requirePermission('leads', 'read'),
  validateRequest(userIdParamSchema, 'params'),
  LeadsController.getById
);

// Step 4: Update Lead By ID
router.patch(
  '/:id',
  requirePermission('leads', 'update'),
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(updateLeadSchema, 'body'),
  LeadsController.update
);

// Step 5: Soft Delete Lead By ID
router.delete(
  '/:id',
  requirePermission('leads', 'delete'),
  validateRequest(userIdParamSchema, 'params'),
  LeadsController.delete
);

// Step 6: Convert Qualified Lead to Account and Contact
router.post(
  '/:id/convert',
  requirePermission('leads', 'convert'),
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(convertLeadSchema, 'body'),
  LeadsController.convert
);

export const leadRoutes = router;
