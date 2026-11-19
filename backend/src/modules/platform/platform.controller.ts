import { Request, Response } from 'express';
import { PlatformService } from './platform.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Platform Controller
// HTTP request handlers for Nexora Platform Administration
// =============================================================================

export class PlatformController {
  // Step 1: Create a new organization and assign initial Organization Admin
  public static async createOrganization(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      Logger.info(`[PlatformController.createOrganization] Processing creation of: "${req.body.name}"`);
      const result = await PlatformService.createOrganization(req.userContext, req.body);
      ApiResponse.success(res, result, 'Organization created and initial administrator provisioned successfully', 201);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create organization';
      Logger.error(`[PlatformController.createOrganization] Error: ${errorMsg}`);
      const statusCode = errorMsg.includes('already in use') ? 409 : 400;
      ApiResponse.error(res, errorMsg, 'ORGANIZATION_CREATION_FAILED', statusCode);
    }
  }

  // Step 2: List tenant organizations with pagination & search
  public static async listOrganizations(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, status } = req.query as any;
      Logger.info(`[PlatformController.listOrganizations] Listing organizations: page=${page}, search=${search}`);
      const result = await PlatformService.listOrganizations({ page, limit, search, status });
      ApiResponse.success(res, result, 'Organizations retrieved successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to list organizations';
      Logger.error(`[PlatformController.listOrganizations] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'FETCH_ORGANIZATIONS_FAILED', 500);
    }
  }

  // Step 3: Get single organization details
  public static async getOrganizationById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      Logger.info(`[PlatformController.getOrganizationById] Fetching organization: ${id}`);
      const result = await PlatformService.getOrganizationById(id);
      ApiResponse.success(res, result, 'Organization details retrieved successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to retrieve organization';
      Logger.error(`[PlatformController.getOrganizationById] Error: ${errorMsg}`);
      const statusCode = errorMsg.includes('not found') ? 404 : 500;
      ApiResponse.error(res, errorMsg, 'FETCH_ORGANIZATION_FAILED', statusCode);
    }
  }

  // Step 4: Update organization metadata
  public static async updateOrganization(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const id = String(req.params.id);
      Logger.info(`[PlatformController.updateOrganization] Updating org: ${id}`);
      const result = await PlatformService.updateOrganization(req.userContext, id, req.body);
      ApiResponse.success(res, result, 'Organization updated successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update organization';
      Logger.error(`[PlatformController.updateOrganization] Error: ${errorMsg}`);
      const statusCode = errorMsg.includes('already in use') ? 409 : 400;
      ApiResponse.error(res, errorMsg, 'UPDATE_ORGANIZATION_FAILED', statusCode);
    }
  }

  // Step 5: Update organization status (ACTIVE / SUSPENDED)
  public static async updateOrganizationStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const id = String(req.params.id);
      Logger.info(`[PlatformController.updateOrganizationStatus] Toggling status for org ${id} to ${req.body.status}`);
      const result = await PlatformService.updateOrganizationStatus(req.userContext, id, req.body);
      ApiResponse.success(res, result, `Organization status updated to ${req.body.status} successfully`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update organization status';
      Logger.error(`[PlatformController.updateOrganizationStatus] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'UPDATE_STATUS_FAILED', 400);
    }
  }

  // Step 6: Assign or invite initial Organization Admin
  public static async assignOrganizationAdmin(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const id = String(req.params.id);
      Logger.info(`[PlatformController.assignOrganizationAdmin] Assigning admin for org: ${id}`);
      const result = await PlatformService.assignOrganizationAdmin(req.userContext, id, req.body);
      ApiResponse.success(res, result, 'Organization administrator assigned successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to assign organization administrator';
      Logger.error(`[PlatformController.assignOrganizationAdmin] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'ASSIGN_ADMIN_FAILED', 400);
    }
  }
}
