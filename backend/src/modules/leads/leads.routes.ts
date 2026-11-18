import { Router } from 'express';
import { LeadsController } from './leads.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  leadQuerySchema,
  leadIdParamSchema,
  createLeadSchema,
  updateLeadSchema,
  convertLeadSchema,
  createActivitySchema,
} from './leads.validators.js';

// =============================================================================
// Leads Routes
// REST API endpoints for Lead lifecycle, activities, and conversion
// =============================================================================

const router = Router();

// List organization leads (with filtering, search, pagination)
router.get(
  '/',
  requireAuth,
  requirePermission('leads', 'read'),
  validateRequest(leadQuerySchema, 'query'),
  LeadsController.listLeads
);

// Get single lead details
router.get(
  '/:id',
  requireAuth,
  requirePermission('leads', 'read'),
  validateRequest(leadIdParamSchema, 'params'),
  LeadsController.getLeadById
);

// Create new lead
router.post(
  '/',
  requireAuth,
  requirePermission('leads', 'create'),
  validateRequest(createLeadSchema, 'body'),
  LeadsController.createLead
);

// Update lead attributes
router.patch(
  '/:id',
  requireAuth,
  requirePermission('leads', 'update'),
  validateRequest(leadIdParamSchema, 'params'),
  validateRequest(updateLeadSchema, 'body'),
  LeadsController.updateLead
);

// Delete lead
router.delete(
  '/:id',
  requireAuth,
  requirePermission('leads', 'delete'),
  validateRequest(leadIdParamSchema, 'params'),
  LeadsController.deleteLead
);

// Convert lead to Account + Contact (+ Opportunity)
router.post(
  '/:id/convert',
  requireAuth,
  requirePermission('leads', 'update'),
  validateRequest(leadIdParamSchema, 'params'),
  validateRequest(convertLeadSchema, 'body'),
  LeadsController.convertLead
);

// Activities for this lead
router.get(
  '/:id/activities',
  requireAuth,
  requirePermission('leads', 'read'),
  validateRequest(leadIdParamSchema, 'params'),
  LeadsController.listActivities
);

router.post(
  '/:id/activities',
  requireAuth,
  requirePermission('leads', 'update'),
  validateRequest(leadIdParamSchema, 'params'),
  validateRequest(createActivitySchema, 'body'),
  LeadsController.createActivity
);

export const leadRoutes = router;
