import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';
import { Logger } from '../utils/logger.js';
import { env } from '../config/env.js';

// =============================================================================
// Centralized Error Handling Middleware
// Formats uncaught exceptions into standard API responses without leaking secrets
// =============================================================================

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Step 1: Log uncaught exception securely
  Logger.error(`[ErrorHandler] Uncaught exception on ${req.method} ${req.url}: ${err.message}`, {
    stack: err.stack,
    name: err.name,
  });

  // Step 2: Prepare safe error details (avoid leaking sensitive internal stacks in production)
  const isDevelopment = env.NODE_ENV === 'development';
  const errorDetails = isDevelopment ? { stack: err.stack } : null;

  // Step 3: Send standardized failure response
  ApiResponse.error(
    res,
    err.message || 'An unexpected internal error occurred on the server.',
    'INTERNAL_SERVER_ERROR',
    500,
    errorDetails
  );
};
