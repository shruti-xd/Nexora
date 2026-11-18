import { supabaseAdmin } from '../../config/supabase.js';
import { AuthUserContext } from '../../types/api.types.js';
import { AuditService } from '../../services/audit.service.js';
import { Logger } from '../../utils/logger.js';
import {
  CreateLeadDTO,
  UpdateLeadDTO,
  ConvertLeadDTO,
  LeadQueryOptions,
  CreateActivityDTO,
} from './leads.types.js';

// =============================================================================
// Leads Service
// Business logic for Lead lifecycle, activities, and conversion
// =============================================================================

export class LeadsService {
  // Query leads with pagination, text search, and status filtering
  public static async listLeads(context: AuthUserContext, options: LeadQueryOptions) {
    const orgId = context.activeOrganization.id;
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('leads')
      .select(
        `
        id,
        organization_id,
        first_name,
        last_name,
        email,
        phone,
        company,
        title,
        status,
        source,
        estimated_value,
        lead_score,
        custom_fields,
        owner_id,
        converted_at,
        converted_account_id,
        converted_contact_id,
        converted_opportunity_id,
        created_at,
        updated_at,
        profiles (id, full_name, email, avatar_url)
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId);

    // Apply status filter
    if (options.status && options.status !== 'All') {
      query = query.eq('status', options.status);
    }

    // Apply owner filter if specified
    if (options.ownerId) {
      query = query.eq('owner_id', options.ownerId);
    }

    // Apply search filter (first name, last name, company, email)
    if (options.search && options.search.trim().length > 0) {
      const q = options.search.trim();
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`
      );
    }

    // Apply sorting and range pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: leads, count, error } = await query;
    if (error) {
      Logger.error(`[LeadsService.listLeads] Database query failed: ${error.message}`);
      throw new Error(`Failed to list leads: ${error.message}`);
    }

    const total = count || 0;
    return {
      leads: leads || [],
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1,
        page,
        limit,
      },
    };
  }

  // Retrieve single lead by ID with owner profile
  public static async getLeadById(context: AuthUserContext, leadId: string) {
    const orgId = context.activeOrganization.id;

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .select(
        `
        id,
        organization_id,
        first_name,
        last_name,
        email,
        phone,
        company,
        title,
        status,
        source,
        estimated_value,
        lead_score,
        custom_fields,
        owner_id,
        converted_at,
        converted_account_id,
        converted_contact_id,
        converted_opportunity_id,
        created_at,
        updated_at,
        profiles (id, full_name, email, avatar_url)
      `
      )
      .eq('id', leadId)
      .eq('organization_id', orgId)
      .single();

    if (error || !lead) {
      Logger.warn(`[LeadsService.getLeadById] Lead ${leadId} not found in org ${orgId}`);
      throw new Error('Lead not found');
    }

    return lead;
  }

  // Create new lead scoped to active organization
  public static async createLead(context: AuthUserContext, payload: CreateLeadDTO) {
    const orgId = context.activeOrganization.id;
    const ownerId = payload.ownerId || context.id;

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        organization_id: orgId,
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        phone: payload.phone || null,
        company: payload.company,
        title: payload.title || null,
        status: payload.status || 'New',
        source: payload.source || 'Direct',
        estimated_value: payload.estimatedValue ?? 0,
        lead_score: payload.leadScore ?? 0,
        custom_fields: payload.customFields || {},
        owner_id: ownerId,
      })
      .select()
      .single();

    if (error || !lead) {
      Logger.error(`[LeadsService.createLead] Failed to insert lead: ${error?.message}`);
      throw new Error(`Failed to create lead: ${error?.message}`);
    }

    // Write audit log
    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'LEAD_CREATED',
      resource: 'leads',
      resourceId: lead.id,
      metadata: { company: lead.company, email: lead.email },
    });

    return lead;
  }

  // Update existing lead fields
  public static async updateLead(
    context: AuthUserContext,
    leadId: string,
    payload: UpdateLeadDTO
  ) {
    const orgId = context.activeOrganization.id;

    // Verify lead exists in caller's workspace
    await this.getLeadById(context, leadId);

    const updatePayload: Record<string, unknown> = {};
    if (payload.firstName !== undefined) updatePayload.first_name = payload.firstName;
    if (payload.lastName !== undefined) updatePayload.last_name = payload.lastName;
    if (payload.email !== undefined) updatePayload.email = payload.email;
    if (payload.phone !== undefined) updatePayload.phone = payload.phone;
    if (payload.company !== undefined) updatePayload.company = payload.company;
    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.source !== undefined) updatePayload.source = payload.source;
    if (payload.estimatedValue !== undefined) updatePayload.estimated_value = payload.estimatedValue;
    if (payload.leadScore !== undefined) updatePayload.lead_score = payload.leadScore;
    if (payload.customFields !== undefined) updatePayload.custom_fields = payload.customFields;
    if (payload.ownerId !== undefined) updatePayload.owner_id = payload.ownerId;

    const { data: updatedLead, error } = await supabaseAdmin
      .from('leads')
      .update(updatePayload)
      .eq('id', leadId)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error || !updatedLead) {
      Logger.error(`[LeadsService.updateLead] Update failed: ${error?.message}`);
      throw new Error(`Failed to update lead: ${error?.message}`);
    }

    return updatedLead;
  }

  // Delete lead record
  public static async deleteLead(context: AuthUserContext, leadId: string) {
    const orgId = context.activeOrganization.id;

    await this.getLeadById(context, leadId);

    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('organization_id', orgId);

    if (error) {
      Logger.error(`[LeadsService.deleteLead] Delete failed: ${error.message}`);
      throw new Error(`Failed to delete lead: ${error.message}`);
    }

    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'LEAD_DELETED',
      resource: 'leads',
      resourceId: leadId,
      metadata: {},
    });

    return { deleted: true, leadId };
  }

  // Convert qualified lead to Account, Contact, and optional Opportunity
  public static async convertLead(
    context: AuthUserContext,
    leadId: string,
    payload: ConvertLeadDTO
  ) {
    const orgId = context.activeOrganization.id;
    const userId = context.id;

    // 1. Fetch current lead
    const lead = await this.getLeadById(context, leadId);
    if (lead.status === 'Converted') {
      throw new Error('This lead has already been converted');
    }

    // 2. Try calling stored procedure first
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('convert_lead', {
      p_lead_id: leadId,
      p_user_id: userId,
      p_create_opportunity: payload.createOpportunity ?? true,
      p_opp_name: payload.oppName || `${lead.company} — Deal`,
      p_opp_amount: payload.oppAmount ?? lead.estimated_value,
      p_existing_account_id: payload.existingAccountId || null,
    });

    if (!rpcError && rpcData) {
      Logger.info(`[LeadsService.convertLead] Conversion executed via stored procedure`);
      return rpcData;
    }

    // 3. Fallback: Execute conversion sequentially if stored procedure is not yet deployed
    Logger.warn(
      `[LeadsService.convertLead] Stored procedure unavailable (${rpcError?.message}), executing fallback sequence`
    );

    let accountId = payload.existingAccountId;
    if (!accountId) {
      const { data: newAccount, error: accError } = await supabaseAdmin
        .from('accounts')
        .insert({
          organization_id: orgId,
          name: lead.company,
          owner_id: userId,
        })
        .select()
        .single();

      if (accError) throw new Error(`Failed to create account: ${accError.message}`);
      accountId = newAccount.id;
    }

    // Create Contact
    const { data: newContact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: orgId,
        account_id: accountId,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        title: lead.title,
        is_decision_maker: true,
        owner_id: userId,
      })
      .select()
      .single();

    if (contactError) throw new Error(`Failed to create contact: ${contactError.message}`);

    // Optionally create Opportunity
    let oppId: string | null = null;
    if (payload.createOpportunity) {
      const { data: newOpp, error: oppError } = await supabaseAdmin
        .from('opportunities')
        .insert({
          organization_id: orgId,
          account_id: accountId,
          primary_contact_id: newContact.id,
          name: payload.oppName || `${lead.company} — Deal`,
          amount: payload.oppAmount ?? lead.estimated_value ?? 0,
          stage: 'Qualification',
          probability: 20,
          close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          owner_id: userId,
        })
        .select()
        .single();

      if (oppError) throw new Error(`Failed to create opportunity: ${oppError.message}`);
      oppId = newOpp.id;
    }

    // Mark Lead as converted
    await supabaseAdmin
      .from('leads')
      .update({
        status: 'Converted',
        converted_at: new Date().toISOString(),
        converted_account_id: accountId,
        converted_contact_id: newContact.id,
        converted_opportunity_id: oppId,
      })
      .eq('id', leadId)
      .eq('organization_id', orgId);

    await AuditService.log({
      organizationId: orgId,
      userId,
      action: 'LEAD_CONVERTED',
      resource: 'leads',
      resourceId: leadId,
      metadata: { accountId, contactId: newContact.id, opportunityId: oppId },
    });

    return {
      lead_id: leadId,
      account_id: accountId,
      contact_id: newContact.id,
      opportunity_id: oppId,
    };
  }

  // List activities logged on a specific lead
  public static async listActivities(context: AuthUserContext, leadId: string) {
    const orgId = context.activeOrganization.id;

    // Verify lead existence in org
    await this.getLeadById(context, leadId);

    const { data: activities, error } = await supabaseAdmin
      .from('activities')
      .select('*, profiles(id, full_name, email, avatar_url)')
      .eq('organization_id', orgId)
      .eq('related_type', 'Lead')
      .eq('related_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      Logger.error(`[LeadsService.listActivities] Error: ${error.message}`);
      throw new Error(`Failed to list activities: ${error.message}`);
    }

    return activities || [];
  }

  // Log activity on a lead
  public static async createActivity(
    context: AuthUserContext,
    leadId: string,
    payload: CreateActivityDTO
  ) {
    const orgId = context.activeOrganization.id;

    await this.getLeadById(context, leadId);

    const { data: activity, error } = await supabaseAdmin
      .from('activities')
      .insert({
        organization_id: orgId,
        type: payload.type,
        subject: payload.subject,
        description: payload.description || null,
        related_type: 'Lead',
        related_id: leadId,
        owner_id: context.id,
        due_date: payload.dueDate || null,
        completed: payload.completed ?? false,
      })
      .select('*, profiles(id, full_name, email, avatar_url)')
      .single();

    if (error || !activity) {
      Logger.error(`[LeadsService.createActivity] Insert error: ${error?.message}`);
      throw new Error(`Failed to log activity: ${error?.message}`);
    }

    return activity;
  }
}
