import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { registerSchema, updateProfileSchema } from './auth.validators.js';

// =============================================================================
// Auth Routes
// Endpoints for user onboarding, self profile inspection, and session updates
// =============================================================================

const router = Router();

// Step 1: Public Registration endpoint with rate limiting and schema validation
router.post(
  '/register',
  authLimiter,
  validateRequest(registerSchema),
  AuthController.register
);

// Step 2: Protected self profile endpoint
router.get(
  '/me',
  requireAuth,
  AuthController.getMe
);

// Step 3: Protected self profile update endpoint
router.patch(
  '/me',
  requireAuth,
  validateRequest(updateProfileSchema),
  AuthController.updateMe
);

// Step 4: Protected logout audit endpoint
router.post(
  '/logout',
  requireAuth,
  AuthController.logout
);

export const authRoutes = router;
