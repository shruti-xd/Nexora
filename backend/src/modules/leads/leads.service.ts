import { supabaseAdmin } from '../../config/supabase.js';
import { AuthUserContext } from '../../types/api.types.js';
import {
  LeadEntity,
  LeadQueryOptions,
  ConvertLeadDTO,
  ConvertLeadResult,
} from '../../types/crm.types.js';
import { Logger } from '../../utils/logger.js';
import { AuditService } from '../../services/audit.service.js';

// =============================================================================
// Leads Service
// Business logic, data isolation, and query execution for Leads & Lead Conversion
// =============================================================================

export class LeadsService {
  // Step 1: Create a new lead within the authenticated organization
  public static async createLead(
    context: AuthUserContext,
    payload: any
  ): Promise<LeadEntity> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    const ownerUserId = payload.ownerUserId || context.id;

    Logger.info(
      `[LeadsService.createLead] Step 1: Creating lead "${payload.lastName}, ${payload.firstName || ''}" (${payload.company}) for org ${orgId}`
    );

    // Step 1.1: If custom owner specified, verify owner belongs to same organization
    if (payload.ownerUserId && payload.ownerUserId !== context.id) {
      Logger.debug(`[LeadsService.createLead] Step 1.1: Verifying owner ${payload.ownerUserId} membership`);
      const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgId)
        .eq('user_id', payload.ownerUserId)
        .eq('is_active', true)
        .maybeSingle();

      if (!member) {
        throw new Error('Assigned owner does not belong to this organization');
      }
    }

    // Step 1.2: Insert lead record
    const { data: lead, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        organization_id: orgId,
        owner_user_id: ownerUserId,
        created_by: context.id,
        first_name: payload.firstName ? payload.firstName.trim() : null,
        last_name: payload.lastName.trim(),
        company: payload.company.trim(),
        title: payload.title || null,
        email: payload.email ? payload.email.trim().toLowerCase() : null,
        phone: payload.phone || null,
        mobile: payload.mobile || null,
        website: payload.website || null,
        industry: payload.industry || null,
        source: payload.source || 'OTHER',
        status: payload.status || 'NEW',
        rating: payload.rating || 'WARM',
        annual_revenue: payload.annualRevenue || null,
        employee_count: payload.employeeCount || null,
        description: payload.description || null,
        street: payload.street || null,
        city: payload.city || null,
        state: payload.state || null,
        country: payload.country || null,
        postal_code: payload.postalCode || null,
        is_deleted: false,
      })
      .select('*, profiles!owner_user_id(id, full_name, email)')
      .single();

    if (insertError || !lead) {
      Logger.error(`[LeadsService.createLead] Step 1: Insert failed: ${insertError?.message}`);
      throw new Error(`Failed to create lead: ${insertError?.message}`);
    }

    // Step 1.3: Audit log
    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'LEAD_CREATED',
      resource: 'leads',
      resourceId: lead.id,
      metadata: { company: lead.company, lastName: lead.last_name, status: lead.status },
    });

    Logger.info(`[LeadsService.createLead] Step 1: Lead created successfully: ${lead.id}`);

    return this.mapDbLead(lead);
  }

  // Step 2: List leads with search, filters, sorting, and pagination
  public static async listLeads(
    context: AuthUserContext,
    options: LeadQueryOptions
  ) {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';

    Logger.info(
      `[LeadsService.listLeads] Step 2: Listing leads for org ${orgId} (Page=${page}, Limit=${limit}, Search="${options.search || ''}")`
    );

    // Build base query
    let query = supabaseAdmin
      .from('leads')
      .select(
        '*, profiles!owner_user_id(id, full_name, email), accounts!converted_account_id(id, name), contacts!converted_contact_id(id, first_name, last_name)',
        { count: 'exact' }
      )
      .eq('organization_id', orgId)
      .eq('is_deleted', false);

    // SALES_REP scoping
    if (context.role === 'SALES_REP') {
      Logger.debug(`[LeadsService.listLeads] Applying SALES_REP ownership restriction: owner=${context.id}`);
      query = query.eq('owner_user_id', context.id);
    } else if (options.ownerId) {
      query = query.eq('owner_user_id', options.ownerId);
    }

    // Filter by status
    if (options.status) {
      query = query.eq('status', options.status);
    }

    // Filter by rating
    if (options.rating) {
      query = query.eq('rating', options.rating);
    }

    // Filter by source
    if (options.source) {
      query = query.eq('source', options.source);
    }

    // Filter by conversion status
    if (options.isConverted !== undefined) {
      if (options.isConverted) {
        query = query.not('converted_at', 'is', null);
      } else {
        query = query.is('converted_at', null);
      }
    }

    // Search by name, company, email, phone
    if (options.search && options.search.trim().length > 0) {
      const term = options.search.trim();
      query = query.or(`company.ilike.%${term}%,last_name.ilike.%${term}%,first_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
    }

    // Sorting & Pagination
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data: leads, error, count } = await query;

    if (error) {
      Logger.error(`[LeadsService.listLeads] Query failed: ${error.message}`);
      throw new Error(`Failed to list leads: ${error.message}`);
    }

    const mappedLeads: LeadEntity[] = (leads || []).map((l) => this.mapDbLead(l));

    Logger.info(
      `[LeadsService.listLeads] Successfully retrieved ${mappedLeads.length} leads (Total: ${count || 0})`
    );

    return {
      leads: mappedLeads,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // Step 3: Get single lead details by ID
  public static async getLeadById(
    context: AuthUserContext,
    leadId: string
  ): Promise<LeadEntity> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    Logger.info(`[LeadsService.getLeadById] Step 3: Querying lead ${leadId} in org ${orgId}`);

    let query = supabaseAdmin
      .from('leads')
      .select(
        '*, profiles!owner_user_id(id, full_name, email), accounts!converted_account_id(id, name), contacts!converted_contact_id(id, first_name, last_name)'
      )
      .eq('id', leadId)
      .eq('organization_id', orgId)
      .eq('is_deleted', false);

    if (context.role === 'SALES_REP') {
      query = query.eq('owner_user_id', context.id);
    }

    const { data: lead, error } = await query.single();

    if (error || !lead) {
      Logger.warn(`[LeadsService.getLeadById] Lead ${leadId} not found or unauthorized`);
      throw new Error('Lead not found');
    }

    return this.mapDbLead(lead);
  }

  // Step 4: Update an existing lead
  public static async updateLead(
    context: AuthUserContext,
    leadId: string,
    payload: any
  ): Promise<LeadEntity> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    Logger.info(`[LeadsService.updateLead] Step 4: Updating lead ${leadId} in org ${orgId}`);

    // Verify existing lead exists and user is permitted
    await this.getLeadById(context, leadId);

    // If owner is being updated, verify new owner membership
    if (payload.ownerUserId) {
      const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgId)
        .eq('user_id', payload.ownerUserId)
        .eq('is_active', true)
        .maybeSingle();

      if (!member) {
        throw new Error('Assigned owner does not belong to this organization');
      }
    }

    const updateData: any = {};
    if (payload.firstName !== undefined) updateData.first_name = payload.firstName ? payload.firstName.trim() : null;
    if (payload.lastName !== undefined) updateData.last_name = payload.lastName.trim();
    if (payload.company !== undefined) updateData.company = payload.company.trim();
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.email !== undefined) updateData.email = payload.email ? payload.email.trim().toLowerCase() : null;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.mobile !== undefined) updateData.mobile = payload.mobile;
    if (payload.website !== undefined) updateData.website = payload.website;
    if (payload.industry !== undefined) updateData.industry = payload.industry;
    if (payload.source !== undefined) updateData.source = payload.source;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.rating !== undefined) updateData.rating = payload.rating;
    if (payload.annualRevenue !== undefined) updateData.annual_revenue = payload.annualRevenue;
    if (payload.employeeCount !== undefined) updateData.employee_count = payload.employeeCount;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.street !== undefined) updateData.street = payload.street;
    if (payload.city !== undefined) updateData.city = payload.city;
    if (payload.state !== undefined) updateData.state = payload.state;
    if (payload.country !== undefined) updateData.country = payload.country;
    if (payload.postalCode !== undefined) updateData.postal_code = payload.postalCode;
    if (payload.ownerUserId !== undefined) updateData.owner_user_id = payload.ownerUserId;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .eq('organization_id', orgId)
      .select(
        '*, profiles!owner_user_id(id, full_name, email), accounts!converted_account_id(id, name), contacts!converted_contact_id(id, first_name, last_name)'
      )
      .single();

    if (updateError || !updated) {
      Logger.error(`[LeadsService.updateLead] Update failed: ${updateError?.message}`);
      throw new Error(`Failed to update lead: ${updateError?.message}`);
    }

    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'LEAD_UPDATED',
      resource: 'leads',
      resourceId: leadId,
      metadata: { fields: Object.keys(updateData) },
    });

    return this.mapDbLead(updated);
  }

  // Step 5: Soft delete lead
  public static async deleteLead(
    context: AuthUserContext,
    leadId: string
  ): Promise<{ id: string; success: boolean }> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    Logger.info(`[LeadsService.deleteLead] Step 5: Soft-deleting lead ${leadId} in org ${orgId}`);

    // Role check: Only ADMIN or MANAGER can delete
    if (context.role !== 'ADMIN' && context.role !== 'MANAGER') {
      Logger.warn(`[LeadsService.deleteLead] User ${context.id} with role ${context.role} denied deletion`);
      throw new Error('You do not have permission to delete leads');
    }

    const { error } = await supabaseAdmin
      .from('leads')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .eq('organization_id', orgId);

    if (error) {
      Logger.error(`[LeadsService.deleteLead] Soft delete failed: ${error.message}`);
      throw new Error(`Failed to delete lead: ${error.message}`);
    }

    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'LEAD_DELETED',
      resource: 'leads',
      resourceId: leadId,
      metadata: { softDelete: true },
    });

    Logger.info(`[LeadsService.deleteLead] Lead ${leadId} marked as deleted`);
    return { id: leadId, success: true };
  }

  // Step 6: Atomic Lead Conversion into Account & Contact
  public static async convertLead(
    context: AuthUserContext,
    leadId: string,
    dto: ConvertLeadDTO
  ): Promise<ConvertLeadResult> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    Logger.info(
      `[LeadsService.convertLead] Step 6: Initiating atomic lead conversion for lead ${leadId} (User: ${context.id})`
    );

    // Step 6.1: Verify lead exists, belongs to organization, and is not already converted
    const lead = await this.getLeadById(context, leadId);

    if (lead.convertedAt) {
      Logger.warn(`[LeadsService.convertLead] Lead ${leadId} is already converted at ${lead.convertedAt}`);
      throw new Error('This lead has already been converted');
    }

    // Step 6.2: Execute transactional stored procedure in PostgreSQL
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('convert_lead_atomic', {
      p_lead_id: leadId,
      p_user_id: context.id,
      p_create_new_account: dto.createNewAccount ?? true,
      p_existing_account_id: dto.existingAccountId || null,
      p_account_name: dto.createNewAccount ? dto.accountName || lead.company : null,
      p_create_new_contact: dto.createNewContact ?? true,
      p_existing_contact_id: dto.existingContactId || null,
      p_contact_first_name: dto.createNewContact ? dto.contactFirstName || lead.firstName : null,
      p_contact_last_name: dto.createNewContact ? dto.contactLastName || lead.lastName : null,
      p_contact_email: dto.createNewContact ? dto.contactEmail || lead.email : null,
      p_contact_phone: dto.createNewContact ? dto.contactPhone || lead.phone : null,
    });

    if (rpcError || !result) {
      Logger.error(`[LeadsService.convertLead] Stored procedure failed: ${rpcError?.message}`);
      throw new Error(`Lead conversion failed: ${rpcError?.message}`);
    }

    // Step 6.3: Record audit log
    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'LEAD_CONVERTED',
      resource: 'leads',
      resourceId: leadId,
      metadata: {
        accountId: result.accountId,
        contactId: result.contactId,
        convertedAt: result.convertedAt,
      },
    });

    Logger.info(
      `[LeadsService.convertLead] Lead conversion successful: Lead ${leadId} -> Account ${result.accountId}, Contact ${result.contactId}`
    );

    return {
      leadId: result.leadId,
      accountId: result.accountId,
      contactId: result.contactId,
      convertedAt: result.convertedAt,
    };
  }

  // Helper mapper
  private static mapDbLead(l: any): LeadEntity {
    return {
      id: l.id,
      organizationId: l.organization_id,
      ownerUserId: l.owner_user_id,
      createdBy: l.created_by,
      firstName: l.first_name,
      lastName: l.last_name,
      company: l.company,
      title: l.title,
      email: l.email,
      phone: l.phone,
      mobile: l.mobile,
      website: l.website,
      industry: l.industry,
      source: l.source,
      status: l.status,
      rating: l.rating,
      annualRevenue: l.annual_revenue ? parseFloat(l.annual_revenue) : null,
      employeeCount: l.employee_count,
      description: l.description,
      street: l.street,
      city: l.city,
      state: l.state,
      country: l.country,
      postalCode: l.postal_code,
      convertedAt: l.converted_at,
      convertedAccountId: l.converted_account_id,
      convertedContactId: l.converted_contact_id,
      isDeleted: l.is_deleted,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
      owner: l.profiles
        ? {
            id: l.profiles.id,
            fullName: l.profiles.full_name,
            email: l.profiles.email,
          }
        : undefined,
      convertedAccount: l.accounts
        ? {
            id: l.accounts.id,
            name: l.accounts.name,
          }
        : undefined,
      convertedContact: l.contacts
        ? {
            id: l.contacts.id,
            firstName: l.contacts.first_name,
            lastName: l.contacts.last_name,
          }
        : undefined,
    };
  }
}
