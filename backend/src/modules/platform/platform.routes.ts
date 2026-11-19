import { Router } from 'express';
import { PlatformController } from './platform.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requirePlatformAdmin } from '../../middleware/rbac.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { userIdParamSchema } from '../users/users.validators.js';
import {
  createOrganizationSchema,
  updatePlatformOrganizationSchema,
  updatePlatformOrganizationStatusSchema,
  assignOrganizationAdminSchema,
  platformOrgQuerySchema,
} from './platform.validators.js';

// =============================================================================
// Platform Administration Routes
// Protected endpoints strictly reserved for Nexora Platform Administrators
// =============================================================================

const router = Router();

// Apply requireAuth and requirePlatformAdmin to all platform routes
router.use(requireAuth);
router.use(requirePlatformAdmin);

// Step 1: Create a new organization and assign initial Organization Admin
router.post(
  '/organizations',
  validateRequest(createOrganizationSchema, 'body'),
  PlatformController.createOrganization
);

// Step 2: List all organizations with search & pagination
router.get(
  '/organizations',
  validateRequest(platformOrgQuerySchema, 'query'),
  PlatformController.listOrganizations
);

// Step 3: Get single organization details
router.get(
  '/organizations/:id',
  validateRequest(userIdParamSchema, 'params'),
  PlatformController.getOrganizationById
);

// Step 4: Update organization metadata
router.patch(
  '/organizations/:id',
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(updatePlatformOrganizationSchema, 'body'),
  PlatformController.updateOrganization
);

// Step 5: Update organization active / suspended status
router.patch(
  '/organizations/:id/status',
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(updatePlatformOrganizationStatusSchema, 'body'),
  PlatformController.updateOrganizationStatus
);

// Step 6: Assign or invite initial Organization Admin
router.post(
  '/organizations/:id/admin',
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(assignOrganizationAdminSchema, 'body'),
  PlatformController.assignOrganizationAdmin
);

export const platformRoutes = router;
