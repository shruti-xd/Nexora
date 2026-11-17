import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger.js';

// =============================================================================
// Request Logger Middleware
// Logs HTTP method, URL, status code, and execution time
// =============================================================================

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Step 1: Record request start time
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  Logger.info(`[IncomingRequest] --> ${method} ${originalUrl} from IP ${ip}`);

  // Step 2: Intercept response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const logLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';

    if (logLevel === 'ERROR') {
      Logger.error(`[CompletedRequest] <-- ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    } else if (logLevel === 'WARN') {
      Logger.warn(`[CompletedRequest] <-- ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    } else {
      Logger.info(`[CompletedRequest] <-- ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    }
  });

  next();
};
