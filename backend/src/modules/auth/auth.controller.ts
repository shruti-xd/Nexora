import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Auth Controller
// HTTP request handlers for authentication and profile management
// =============================================================================

export class AuthController {
  // Step 1: Handle user registration
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      Logger.info(`[AuthController.register] Processing registration request for: ${req.body.email}`);
      const result = await AuthService.register(req.body);
      ApiResponse.success(res, result, 'Registration and workspace provisioning completed successfully', 201);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      Logger.warn(`[AuthController.register] Registration error: ${errorMsg}`);
      const statusCode = errorMsg.includes('already exists') ? 409 : 400;
      ApiResponse.error(res, errorMsg, 'REGISTRATION_FAILED', statusCode);
    }
  }

  // Step 2: Handle retrieving current user context
  public static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      Logger.info(`[AuthController.getMe] Fetching context for user: ${req.userContext.id}`);
      const result = await AuthService.getMe(req.userContext);
      ApiResponse.success(res, result, 'Current user profile retrieved successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to retrieve user profile';
      Logger.error(`[AuthController.getMe] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'FETCH_PROFILE_FAILED', 500);
    }
  }

  // Step 3: Handle updating user profile
  public static async updateMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      Logger.info(`[AuthController.updateMe] Updating user profile: ${req.userContext.id}`);
      const result = await AuthService.updateMe(req.userContext.id, req.body);
      ApiResponse.success(res, result, 'Profile updated successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update user profile';
      Logger.error(`[AuthController.updateMe] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'UPDATE_PROFILE_FAILED', 400);
    }
  }

  // Step 4: Handle application logout / audit
  public static async logout(req: Request, res: Response): Promise<void> {
    try {
      if (req.userContext) {
        await AuthService.logout(req.userContext);
      }
      ApiResponse.success(res, null, 'Logged out successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Logout failed';
      Logger.warn(`[AuthController.logout] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'LOGOUT_FAILED', 500);
    }
  }
}
