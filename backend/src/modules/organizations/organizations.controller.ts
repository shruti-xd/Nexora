import { Request, Response } from 'express';
import { OrganizationService } from './organizations.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Organization Controller
// HTTP request handlers for workspace operations
// =============================================================================

export class OrganizationController {
  // Step 1: Get current workspace details
  public static async getCurrent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      Logger.info(`[OrganizationController.getCurrent] Request for org: ${req.userContext.activeOrganization.id}`);
      const result = await OrganizationService.getCurrent(req.userContext);
      ApiResponse.success(res, result, 'Current organization retrieved successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to retrieve organization';
      Logger.error(`[OrganizationController.getCurrent] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'FETCH_ORGANIZATION_FAILED', 500);
    }
  }

  // Step 2: Update current workspace settings
  public static async updateCurrent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      Logger.info(`[OrganizationController.updateCurrent] Updating org: ${req.userContext.activeOrganization.id}`);
      const result = await OrganizationService.updateCurrent(req.userContext, req.body);
      ApiResponse.success(res, result, 'Organization updated successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update organization';
      Logger.error(`[OrganizationController.updateCurrent] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'UPDATE_ORGANIZATION_FAILED', 400);
    }
  }
}
