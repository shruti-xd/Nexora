import { Request, Response } from 'express';
import { UsersService } from './users.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Users Controller
// HTTP request handlers for organization user directory, role governance, and invites
// =============================================================================

export class UsersController {
  // Step 1: List organization members with filters
  public static async listMembers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const { page, limit, search, role, status } = req.query as any;
      Logger.info(`[UsersController.listMembers] Listing members: page=${page}, role=${role}, status=${status}`);

      const result = await UsersService.listMembers(req.userContext, { page, limit, search, role, status });
      ApiResponse.success(res, result, 'Organization members retrieved successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to list members';
      Logger.error(`[UsersController.listMembers] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'FETCH_MEMBERS_FAILED', 500);
    }
  }

  // Step 2: Get single member details
  public static async getMemberById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const id = String(req.params.id);
      Logger.info(`[UsersController.getMemberById] Fetching member: ${id}`);

      const result = await UsersService.getMemberById(req.userContext, id);
      ApiResponse.success(res, result, 'Member details retrieved successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to retrieve member';
      Logger.error(`[UsersController.getMemberById] Error: ${errorMsg}`);
      const statusCode = errorMsg.includes('not found') ? 404 : 500;
      ApiResponse.error(res, errorMsg, 'FETCH_MEMBER_FAILED', statusCode);
    }
  }

  // Step 3: Invite new user to organization
  public static async inviteUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      Logger.info(`[UsersController.inviteUser] Inviting user "${req.body.email}"`);
      const result = await UsersService.inviteUser(req.userContext, req.body);
      ApiResponse.success(res, result, 'Invitation sent successfully', 201);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to invite user';
      Logger.warn(`[UsersController.inviteUser] Invite error: ${errorMsg}`);
      const statusCode = errorMsg.includes('already an active member') ? 409 : 400;
      ApiResponse.error(res, errorMsg, 'INVITATION_FAILED', statusCode);
    }
  }

  // Step 4: Resend invitation email
  public static async resendInvitation(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const id = String(req.params.id);
      Logger.info(`[UsersController.resendInvitation] Resending invitation to user: ${id}`);
      const result = await UsersService.resendInvitation(req.userContext, id);
      ApiResponse.success(res, result, result.message);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to resend invitation';
      Logger.error(`[UsersController.resendInvitation] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'RESEND_INVITATION_FAILED', 400);
    }
  }

  // Step 5: Update member role
  public static async updateMemberRole(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const id = String(req.params.id);
      Logger.info(`[UsersController.updateMemberRole] Updating role for member: ${id}`);

      const result = await UsersService.updateMemberRole(req.userContext, id, req.body);
      ApiResponse.success(res, result, 'Member role updated successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update member role';
      Logger.warn(`[UsersController.updateMemberRole] Update role rejected: ${errorMsg}`);
      const statusCode = errorMsg.includes('own role') || errorMsg.includes('only remaining') ? 400 : 403;
      ApiResponse.error(res, errorMsg, 'UPDATE_ROLE_FAILED', statusCode);
    }
  }

  // Step 6: Update member active/inactive status
  public static async updateMemberStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const id = String(req.params.id);
      Logger.info(`[UsersController.updateMemberStatus] Updating status for member: ${id}`);

      const result = await UsersService.updateMemberStatus(req.userContext, id, req.body);
      ApiResponse.success(res, result, 'Member status updated successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update member status';
      Logger.warn(`[UsersController.updateMemberStatus] Update status rejected: ${errorMsg}`);
      const statusCode = errorMsg.includes('own account') || errorMsg.includes('only active') ? 400 : 403;
      ApiResponse.error(res, errorMsg, 'UPDATE_STATUS_FAILED', statusCode);
    }
  }
}
