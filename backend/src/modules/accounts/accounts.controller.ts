import { Request, Response } from 'express';
import { AccountsService } from './accounts.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Accounts Controller
// HTTP request handlers for Account resources with step-wise logs & error handling
// =============================================================================

export class AccountsController {
  // Step 1: Create Account
  public static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[AccountsController.create] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      Logger.info(`[AccountsController.create] Step 1: Incoming create account request from user ${req.userContext.id}`);
      const account = await AccountsService.createAccount(req.userContext, req.body);
      ApiResponse.success(res, account, 'Account created successfully', 201);
    } catch (error: any) {
      Logger.error(`[AccountsController.create] Step 1 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to create account', 'ACCOUNT_CREATE_FAILED', 400);
    }
  }

  // Step 2: List Accounts
  public static async list(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[AccountsController.list] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      Logger.info(`[AccountsController.list] Step 2: Listing accounts for org ${req.userContext.activeOrganization?.id} with query: ${JSON.stringify(req.query)}`);
      const result = await AccountsService.listAccounts(req.userContext, req.query as any);
      ApiResponse.success(res, result, 'Accounts retrieved successfully', 200);
    } catch (error: any) {
      Logger.error(`[AccountsController.list] Step 2 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to list accounts', 'ACCOUNTS_FETCH_FAILED', 500);
    }
  }

  // Step 3: Get Account By ID
  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[AccountsController.getById] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      const id = String(req.params.id);
      Logger.info(`[AccountsController.getById] Step 3: Fetching account details for ID: ${id}`);
      const account = await AccountsService.getAccountById(req.userContext, id);
      ApiResponse.success(res, account, 'Account details retrieved', 200);
    } catch (error: any) {
      Logger.warn(`[AccountsController.getById] Step 3 Failed: ${error.message}`);
      const statusCode = error.message?.includes('not found') ? 404 : 400;
      ApiResponse.error(res, error.message || 'Account not found', 'ACCOUNT_NOT_FOUND', statusCode);
    }
  }

  // Step 4: Update Account
  public static async update(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[AccountsController.update] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      const id = String(req.params.id);
      Logger.info(`[AccountsController.update] Step 4: Updating account ID: ${id}`);
      const updated = await AccountsService.updateAccount(req.userContext, id, req.body);
      ApiResponse.success(res, updated, 'Account updated successfully', 200);
    } catch (error: any) {
      Logger.error(`[AccountsController.update] Step 4 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to update account', 'ACCOUNT_UPDATE_FAILED', 400);
    }
  }

  // Step 5: Soft Delete Account
  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[AccountsController.delete] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      const id = String(req.params.id);
      Logger.info(`[AccountsController.delete] Step 5: Deleting account ID: ${id}`);
      const result = await AccountsService.deleteAccount(req.userContext, id);
      ApiResponse.success(res, result, 'Account deleted successfully', 200);
    } catch (error: any) {
      Logger.error(`[AccountsController.delete] Step 5 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to delete account', 'ACCOUNT_DELETE_FAILED', 400);
    }
  }

  // Step 6: Get Associated Contacts for Account
  public static async getContacts(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[AccountsController.getContacts] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      const id = String(req.params.id);
      Logger.info(`[AccountsController.getContacts] Step 6: Fetching contacts for account ID: ${id}`);
      const contacts = await AccountsService.getAccountContacts(req.userContext, id);
      ApiResponse.success(res, contacts, 'Account contacts retrieved successfully', 200);
    } catch (error: any) {
      Logger.error(`[AccountsController.getContacts] Step 6 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to retrieve contacts for account', 'ACCOUNT_CONTACTS_FETCH_FAILED', 400);
    }
  }
}
