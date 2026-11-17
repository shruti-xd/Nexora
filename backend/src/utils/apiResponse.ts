import { Response } from 'express';
import { Logger } from './logger.js';

// =============================================================================
// API Response Formatter
// Enforces standard response envelope across all endpoints
// =============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details: unknown | null;
  };
}

export class ApiResponse {
  // Step 1: Format and send success response
  public static success<T>(
    res: Response,
    data: T,
    message: string = 'Operation completed successfully',
    statusCode: number = 200
  ): Response {
    // Runtime log for success emission
    Logger.info(`[ApiResponse] Emitting success response [${statusCode}]: ${message}`);
    const payload: ApiSuccessResponse<T> = {
      success: true,
      message,
      data
    };
    return res.status(statusCode).json(payload);
  }

  // Step 2: Format and send error response
  public static error(
    res: Response,
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    details: unknown | null = null
  ): Response {
    // Runtime log for error emission
    Logger.error(`[ApiResponse] Emitting error response [${statusCode}] Code: ${code} - ${message}`, { details });
    const payload: ApiErrorResponse = {
      success: false,
      message,
      error: {
        code,
        details: details ?? null
      }
    };
    return res.status(statusCode).json(payload);
  }
}
