import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { updateProfileSchema } from './auth.validators.js';

// =============================================================================
// Auth Routes
// Endpoints for self profile inspection, profile updates, and session termination
// (Public self-registration has been completely removed in accordance with Salesforce-style access)
// =============================================================================

const router = Router();

// Step 1: Protected self profile endpoint
router.get(
  '/me',
  requireAuth,
  AuthController.getMe
);

// Step 2: Protected self profile update endpoint
router.patch(
  '/me',
  requireAuth,
  validateRequest(updateProfileSchema),
  AuthController.updateMe
);

// Step 3: Protected logout audit endpoint
router.post(
  '/logout',
  requireAuth,
  AuthController.logout
);

export const authRoutes = router;
