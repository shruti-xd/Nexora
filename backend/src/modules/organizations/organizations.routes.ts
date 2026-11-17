import { Router } from 'express';
import { OrganizationController } from './organizations.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { updateOrganizationSchema } from './organizations.validators.js';

// =============================================================================
// Organization Routes
// Endpoints for inspecting and modifying organization workspace settings
// =============================================================================

const router = Router();

// Step 1: Get current workspace details (Requires authentication and org:read permission)
router.get(
  '/current',
  requireAuth,
  requirePermission('organizations', 'read'),
  OrganizationController.getCurrent
);

// Step 2: Update workspace settings (Requires authentication and org:update permission)
router.patch(
  '/current',
  requireAuth,
  requirePermission('organizations', 'update'),
  validateRequest(updateOrganizationSchema),
  OrganizationController.updateCurrent
);

export const organizationRoutes = router;
