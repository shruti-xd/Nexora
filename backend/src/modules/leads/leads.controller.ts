import { Request, Response } from 'express';
import { LeadsService } from './leads.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Leads Controller
// HTTP request handlers for Lead resources and conversion with step-wise logs & error handling
// =============================================================================

export class LeadsController {
  // Step 1: Create Lead
  public static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[LeadsController.create] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      Logger.info(`[LeadsController.create] Step 1: Creating lead by user ${req.userContext.id}`);
      const lead = await LeadsService.createLead(req.userContext, req.body);
      ApiResponse.success(res, lead, 'Lead created successfully', 201);
    } catch (error: any) {
      Logger.error(`[LeadsController.create] Step 1 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to create lead', 'LEAD_CREATE_FAILED', 400);
    }
  }

  // Step 2: List Leads
  public static async list(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[LeadsController.list] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      Logger.info(`[LeadsController.list] Step 2: Listing leads for org ${req.userContext.activeOrganization?.id} with query: ${JSON.stringify(req.query)}`);
      const result = await LeadsService.listLeads(req.userContext, req.query as any);
      ApiResponse.success(res, result, 'Leads retrieved successfully', 200);
    } catch (error: any) {
      Logger.error(`[LeadsController.list] Step 2 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to list leads', 'LEADS_FETCH_FAILED', 500);
    }
  }

  // Step 3: Get Lead By ID
  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[LeadsController.getById] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      const id = String(req.params.id);
      Logger.info(`[LeadsController.getById] Step 3: Fetching lead details for ID: ${id}`);
      const lead = await LeadsService.getLeadById(req.userContext, id);
      ApiResponse.success(res, lead, 'Lead details retrieved', 200);
    } catch (error: any) {
      Logger.warn(`[LeadsController.getById] Step 3 Failed: ${error.message}`);
      const statusCode = error.message?.includes('not found') ? 404 : 400;
      ApiResponse.error(res, error.message || 'Lead not found', 'LEAD_NOT_FOUND', statusCode);
    }
  }

  // Step 4: Update Lead
  public static async update(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[LeadsController.update] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      const id = String(req.params.id);
      Logger.info(`[LeadsController.update] Step 4: Updating lead ID: ${id}`);
      const updated = await LeadsService.updateLead(req.userContext, id, req.body);
      ApiResponse.success(res, updated, 'Lead updated successfully', 200);
    } catch (error: any) {
      Logger.error(`[LeadsController.update] Step 4 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to update lead', 'LEAD_UPDATE_FAILED', 400);
    }
  }

  // Step 5: Soft Delete Lead
  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[LeadsController.delete] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      const id = String(req.params.id);
      Logger.info(`[LeadsController.delete] Step 5: Deleting lead ID: ${id}`);
      const result = await LeadsService.deleteLead(req.userContext, id);
      ApiResponse.success(res, result, 'Lead deleted successfully', 200);
    } catch (error: any) {
      Logger.error(`[LeadsController.delete] Step 5 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to delete lead', 'LEAD_DELETE_FAILED', 400);
    }
  }

  // Step 6: Convert Lead into Account and Contact
  public static async convert(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[LeadsController.convert] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      const id = String(req.params.id);
      Logger.info(`[LeadsController.convert] Step 6: Converting lead ID: ${id}`);
      const result = await LeadsService.convertLead(req.userContext, id, req.body);
      ApiResponse.success(res, result, 'Lead converted successfully', 200);
    } catch (error: any) {
      Logger.error(`[LeadsController.convert] Step 6 Conversion error: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to convert lead', 'LEAD_CONVERT_FAILED', 400);
    }
  }
}
