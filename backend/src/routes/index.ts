import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { organizationRoutes } from '../modules/organizations/organizations.routes.js';
import { userRoutes } from '../modules/users/users.routes.js';
import { leadRoutes } from '../modules/leads/leads.routes.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// API V1 Router
// Aggregates all version 1 domain modules
// =============================================================================

const router = Router();

// Step 1: Health check endpoint
router.get('/health', (_req, res) => {
  Logger.info('[HealthCheck] Service health check invoked');
  ApiResponse.success(
    res,
    {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: '1.0.0',
    },
    'CRM API is operational'
  );
});

// Step 2: Mount domain routes
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/users', userRoutes);
router.use('/leads', leadRoutes);

export const apiV1Routes = router;
