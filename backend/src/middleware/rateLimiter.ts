import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// Rate Limiting Middleware
// Protects endpoints against brute-force attacks and abuse
// =============================================================================

// Step 1: General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    Logger.warn(`[RateLimiter] Rate limit exceeded on general API by IP: ${req.ip}`);
    ApiResponse.error(
      res,
      'Too many requests from this IP, please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429
    );
  },
});

// Step 2: Sensitive Auth rate limiter (stricter limits for registration / login / password reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    Logger.warn(`[RateLimiter] Auth rate limit exceeded on path: ${req.path} by IP: ${req.ip}`);
    ApiResponse.error(
      res,
      'Too many authentication attempts. Please wait 15 minutes before trying again.',
      'AUTH_RATE_LIMIT_EXCEEDED',
      429
    );
  },
});
