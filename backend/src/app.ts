import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/error.middleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { apiV1Routes } from './routes/index.js';
import { docsRoutes } from './docs/swagger.js';
import { ApiResponse } from './utils/apiResponse.js';
import { Logger } from './utils/logger.js';

// =============================================================================
// Express Application Assembly
// Configures middlewares, security controls, routes, and error boundaries
// =============================================================================

export const createApp = (): Express => {
  // Step 1: Initialize Express application
  Logger.info('[AppInit] Step 1: Initializing Express application instance...');
  const app: Express = express();

  // Step 2: Apply Helmet HTTP security headers
  Logger.info('[AppInit] Step 2: Applying Helmet HTTP security headers...');
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI to render assets cleanly
      crossOriginEmbedderPolicy: false,
    })
  );

  // Step 3: Configure strict CORS
  Logger.info(`[AppInit] Step 3: Configuring CORS for origin: ${env.FRONTEND_URL}`);
  app.use(
    cors({
      origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
    })
  );

  // Step 4: Parse incoming JSON payloads and URL encoded bodies
  Logger.info('[AppInit] Step 4: Attaching JSON payload parsers...');
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Step 5: Attach request logging middleware
  app.use(requestLogger);

  // Step 6: Apply API rate limiter to all standard API routes
  app.use('/api', apiLimiter);

  // Step 7: Mount OpenAPI Swagger Documentation
  Logger.info('[AppInit] Step 7: Mounting Swagger documentation at /api/docs...');
  app.use('/api/docs', docsRoutes);

  // Step 8: Mount Versioned API Routes (/api/v1)
  Logger.info('[AppInit] Step 8: Mounting API v1 routes at /api/v1...');
  app.use('/api/v1', apiV1Routes);

  // Step 9: Handle 404 for undefined routes
  app.use('*', (req: Request, res: Response) => {
    Logger.warn(`[RouteNotFound] 404 Not Found: ${req.method} ${req.originalUrl}`);
    ApiResponse.error(
      res,
      `Cannot ${req.method} ${req.originalUrl}. Route not found.`,
      'ROUTE_NOT_FOUND',
      404
    );
  });

  // Step 10: Attach centralized error handling boundary
  Logger.info('[AppInit] Step 10: Attaching centralized error handler...');
  app.use(errorHandler);

  return app;
};
