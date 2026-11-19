import { Request, Response } from 'express';
import { ContactsService } from './contacts.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Contacts Controller
// HTTP request handlers for Contact resources with step-wise logs & error handling
// =============================================================================

export class ContactsController {
  // Step 1: Create Contact
  public static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[ContactsController.create] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      Logger.info(`[ContactsController.create] Step 1: Creating contact by user ${req.userContext.id}`);
      const contact = await ContactsService.createContact(req.userContext, req.body);
      ApiResponse.success(res, contact, 'Contact created successfully', 201);
    } catch (error: any) {
      Logger.error(`[ContactsController.create] Step 1 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to create contact', 'CONTACT_CREATE_FAILED', 400);
    }
  }

  // Step 2: List Contacts
  public static async list(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[ContactsController.list] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      Logger.info(`[ContactsController.list] Step 2: Listing contacts for org ${req.userContext.activeOrganization?.id} with query: ${JSON.stringify(req.query)}`);
      const result = await ContactsService.listContacts(req.userContext, req.query as any);
      ApiResponse.success(res, result, 'Contacts retrieved successfully', 200);
    } catch (error: any) {
      Logger.error(`[ContactsController.list] Step 2 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to list contacts', 'CONTACTS_FETCH_FAILED', 500);
    }
  }

  // Step 3: Get Contact By ID
  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[ContactsController.getById] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      const id = String(req.params.id);
      Logger.info(`[ContactsController.getById] Step 3: Fetching contact details for ID: ${id}`);
      const contact = await ContactsService.getContactById(req.userContext, id);
      ApiResponse.success(res, contact, 'Contact details retrieved', 200);
    } catch (error: any) {
      Logger.warn(`[ContactsController.getById] Step 3 Failed: ${error.message}`);
      const statusCode = error.message?.includes('not found') ? 404 : 400;
      ApiResponse.error(res, error.message || 'Contact not found', 'CONTACT_NOT_FOUND', statusCode);
    }
  }

  // Step 4: Update Contact
  public static async update(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[ContactsController.update] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      const id = String(req.params.id);
      Logger.info(`[ContactsController.update] Step 4: Updating contact ID: ${id}`);
      const updated = await ContactsService.updateContact(req.userContext, id, req.body);
      ApiResponse.success(res, updated, 'Contact updated successfully', 200);
    } catch (error: any) {
      Logger.error(`[ContactsController.update] Step 4 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to update contact', 'CONTACT_UPDATE_FAILED', 400);
    }
  }

  // Step 5: Soft Delete Contact
  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userContext) {
        Logger.warn('[ContactsController.delete] Missing auth userContext');
        ApiResponse.error(res, 'Authentication context missing', 'UNAUTHORIZED', 401);
        return;
      }
      const id = String(req.params.id);
      Logger.info(`[ContactsController.delete] Step 5: Deleting contact ID: ${id}`);
      const result = await ContactsService.deleteContact(req.userContext, id);
      ApiResponse.success(res, result, 'Contact deleted successfully', 200);
    } catch (error: any) {
      Logger.error(`[ContactsController.delete] Step 5 Failed: ${error.message}`);
      ApiResponse.error(res, error.message || 'Failed to delete contact', 'CONTACT_DELETE_FAILED', 400);
    }
  }
}
