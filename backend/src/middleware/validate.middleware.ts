import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../utils/apiResponse.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// Validation Middleware
// Validates request payload against Zod schemas and returns formatted errors
// =============================================================================

export const validateRequest = (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Step 1: Log validation stage
      Logger.debug(`[validateRequest] Validating request ${target} against schema for path: ${req.path}`);

      // Step 2: Parse and validate input data
      const parsedData = await schema.parseAsync(req[target]);

      // Step 3: Overwrite with parsed & sanitized data
      req[target] = parsedData;
      Logger.debug(`[validateRequest] Validation passed for path: ${req.path}`);
      next();
    } catch (err: unknown) {
      // Step 4: Handle validation failures gracefully
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));

        Logger.warn(`[validateRequest] Validation failed for path ${req.path}:`, issues);

        ApiResponse.error(
          res,
          'Validation failed. Please verify the submitted data.',
          'VALIDATION_ERROR',
          400,
          issues
        );
        return;
      }

      Logger.error(`[validateRequest] Unexpected error in validation middleware:`, err);
      ApiResponse.error(res, 'Internal validation error occurred', 'INTERNAL_ERROR', 500);
    }
  };
};
