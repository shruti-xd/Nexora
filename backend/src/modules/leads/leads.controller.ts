import { Request, Response } from 'express';
import { LeadsService } from './leads.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Leads Controller
// HTTP handlers for Lead CRUD, activity logs, and conversion workflows
// =============================================================================

export class LeadsController {
  // GET /api/v1/leads
  public static async listLeads(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const { page, limit, search, status, ownerId } = req.query as any;
      const result = await LeadsService.listLeads(req.userContext, {
        page,
        limit,
        search,
        status,
        ownerId,
      });

      ApiResponse.success(res, result, 'Leads retrieved successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to list leads';
      Logger.error(`[LeadsController.listLeads] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'FETCH_LEADS_FAILED', 500);
    }
  }

  // GET /api/v1/leads/:id
  public static async getLeadById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const leadId = String(req.params.id);
      const lead = await LeadsService.getLeadById(req.userContext, leadId);
      ApiResponse.success(res, lead, 'Lead retrieved successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get lead';
      const statusCode = errorMsg.includes('not found') ? 404 : 500;
      ApiResponse.error(res, errorMsg, 'GET_LEAD_FAILED', statusCode);
    }
  }

  // POST /api/v1/leads
  public static async createLead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const lead = await LeadsService.createLead(req.userContext, req.body);
      ApiResponse.success(res, lead, 'Lead created successfully', 201);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create lead';
      Logger.error(`[LeadsController.createLead] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'CREATE_LEAD_FAILED', 500);
    }
  }

  // PATCH /api/v1/leads/:id
  public static async updateLead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const leadId = String(req.params.id);
      const updated = await LeadsService.updateLead(req.userContext, leadId, req.body);
      ApiResponse.success(res, updated, 'Lead updated successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update lead';
      const statusCode = errorMsg.includes('not found') ? 404 : 500;
      ApiResponse.error(res, errorMsg, 'UPDATE_LEAD_FAILED', statusCode);
    }
  }

  // DELETE /api/v1/leads/:id
  public static async deleteLead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const leadId = String(req.params.id);
      const result = await LeadsService.deleteLead(req.userContext, leadId);
      ApiResponse.success(res, result, 'Lead deleted successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete lead';
      const statusCode = errorMsg.includes('not found') ? 404 : 500;
      ApiResponse.error(res, errorMsg, 'DELETE_LEAD_FAILED', statusCode);
    }
  }

  // POST /api/v1/leads/:id/convert
  public static async convertLead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const leadId = String(req.params.id);
      const result = await LeadsService.convertLead(req.userContext, leadId, req.body);
      ApiResponse.success(res, result, 'Lead converted successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to convert lead';
      Logger.error(`[LeadsController.convertLead] Error: ${errorMsg}`);
      ApiResponse.error(res, errorMsg, 'CONVERT_LEAD_FAILED', 400);
    }
  }

  // GET /api/v1/leads/:id/activities
  public static async listActivities(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const leadId = String(req.params.id);
      const activities = await LeadsService.listActivities(req.userContext, leadId);
      ApiResponse.success(res, activities, 'Lead activities retrieved');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get activities';
      ApiResponse.error(res, errorMsg, 'GET_ACTIVITIES_FAILED', 500);
    }
  }

  // POST /api/v1/leads/:id/activities
  public static async createActivity(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }

      const leadId = String(req.params.id);
      const activity = await LeadsService.createActivity(req.userContext, leadId, req.body);
      ApiResponse.success(res, activity, 'Activity logged successfully', 201);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create activity';
      ApiResponse.error(res, errorMsg, 'CREATE_ACTIVITY_FAILED', 500);
    }
  }
}
