import { supabaseAdmin } from '../../config/supabase.js';
import { AuthUserContext } from '../../types/api.types.js';
import { ContactEntity, ContactQueryOptions } from '../../types/crm.types.js';
import { Logger } from '../../utils/logger.js';
import { AuditService } from '../../services/audit.service.js';

// =============================================================================
// Contacts Service
// Business logic, tenant isolation, and query execution for Contacts
// =============================================================================

export class ContactsService {
  // Step 1: Create a new contact within the authenticated organization
  public static async createContact(
    context: AuthUserContext,
    payload: any
  ): Promise<ContactEntity> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    const ownerUserId = payload.ownerUserId || context.id;

    Logger.info(
      `[ContactsService.createContact] Step 1: Creating contact "${payload.lastName}, ${payload.firstName || ''}" for org ${orgId} (Owner: ${ownerUserId})`
    );

    // Step 1.1: If accountId is provided, verify account exists in the same organization
    if (payload.accountId) {
      Logger.debug(`[ContactsService.createContact] Step 1.1: Verifying account ${payload.accountId} exists in org ${orgId}`);
      const { data: account } = await supabaseAdmin
        .from('accounts')
        .select('id')
        .eq('id', payload.accountId)
        .eq('organization_id', orgId)
        .eq('is_deleted', false)
        .maybeSingle();

      if (!account) {
        throw new Error('Associated account does not exist or belongs to another organization');
      }
    }

    // Step 1.2: If custom owner specified, verify owner belongs to same organization
    if (payload.ownerUserId && payload.ownerUserId !== context.id) {
      Logger.debug(`[ContactsService.createContact] Step 1.2: Verifying owner ${payload.ownerUserId} membership`);
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

    // Step 1.3: Insert contact record
    const { data: contact, error: insertError } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: orgId,
        account_id: payload.accountId || null,
        owner_user_id: ownerUserId,
        created_by: context.id,
        first_name: payload.firstName ? payload.firstName.trim() : null,
        last_name: payload.lastName.trim(),
        title: payload.title || null,
        department: payload.department || null,
        email: payload.email ? payload.email.trim().toLowerCase() : null,
        phone: payload.phone || null,
        mobile: payload.mobile || null,
        description: payload.description || null,
        mailing_street: payload.mailingStreet || null,
        mailing_city: payload.mailingCity || null,
        mailing_state: payload.mailingState || null,
        mailing_country: payload.mailingCountry || null,
        mailing_postal_code: payload.mailingPostalCode || null,
        other_street: payload.otherStreet || null,
        other_city: payload.otherCity || null,
        other_state: payload.otherState || null,
        other_country: payload.otherCountry || null,
        other_postal_code: payload.otherPostalCode || null,
        is_deleted: false,
      })
      .select('*, accounts!account_id(id, name), profiles!owner_user_id(id, full_name, email)')
      .single();

    if (insertError || !contact) {
      Logger.error(`[ContactsService.createContact] Step 1: Insert failed: ${insertError?.message}`);
      throw new Error(`Failed to create contact: ${insertError?.message}`);
    }

    // Step 1.4: Audit log
    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'CONTACT_CREATED',
      resource: 'contacts',
      resourceId: contact.id,
      metadata: { lastName: contact.last_name, accountId: contact.account_id },
    });

    Logger.info(`[ContactsService.createContact] Step 1: Contact created successfully: ${contact.id}`);

    return this.mapDbContact(contact);
  }

  // Step 2: List contacts with search, filters, sorting, and pagination
  public static async listContacts(
    context: AuthUserContext,
    options: ContactQueryOptions
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
      `[ContactsService.listContacts] Step 2: Listing contacts for org ${orgId} (Page=${page}, Limit=${limit}, Search="${options.search || ''}")`
    );

    // Build base query
    let query = supabaseAdmin
      .from('contacts')
      .select(
        '*, accounts!account_id(id, name), profiles!owner_user_id(id, full_name, email)',
        { count: 'exact' }
      )
      .eq('organization_id', orgId)
      .eq('is_deleted', false);

    // SALES_REP scoping
    if (context.role === 'SALES_REP') {
      Logger.debug(`[ContactsService.listContacts] Applying SALES_REP ownership restriction: owner=${context.id}`);
      query = query.eq('owner_user_id', context.id);
    } else if (options.ownerId) {
      query = query.eq('owner_user_id', options.ownerId);
    }

    // Filter by accountId
    if (options.accountId) {
      query = query.eq('account_id', options.accountId);
    }

    // Search by name, email, phone
    if (options.search && options.search.trim().length > 0) {
      const term = options.search.trim();
      query = query.or(`last_name.ilike.%${term}%,first_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
    }

    // Sorting & Pagination
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data: contacts, error, count } = await query;

    if (error) {
      Logger.error(`[ContactsService.listContacts] Query failed: ${error.message}`);
      throw new Error(`Failed to list contacts: ${error.message}`);
    }

    const mappedContacts: ContactEntity[] = (contacts || []).map((c) => this.mapDbContact(c));

    Logger.info(
      `[ContactsService.listContacts] Successfully retrieved ${mappedContacts.length} contacts (Total: ${count || 0})`
    );

    return {
      contacts: mappedContacts,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // Step 3: Get single contact details by ID
  public static async getContactById(
    context: AuthUserContext,
    contactId: string
  ): Promise<ContactEntity> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    Logger.info(`[ContactsService.getContactById] Step 3: Querying contact ${contactId} in org ${orgId}`);

    let query = supabaseAdmin
      .from('contacts')
      .select('*, accounts!account_id(id, name), profiles!owner_user_id(id, full_name, email)')
      .eq('id', contactId)
      .eq('organization_id', orgId)
      .eq('is_deleted', false);

    if (context.role === 'SALES_REP') {
      query = query.eq('owner_user_id', context.id);
    }

    const { data: contact, error } = await query.single();

    if (error || !contact) {
      Logger.warn(`[ContactsService.getContactById] Contact ${contactId} not found or unauthorized`);
      throw new Error('Contact not found');
    }

    return this.mapDbContact(contact);
  }

  // Step 4: Update an existing contact
  public static async updateContact(
    context: AuthUserContext,
    contactId: string,
    payload: any
  ): Promise<ContactEntity> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    Logger.info(`[ContactsService.updateContact] Step 4: Updating contact ${contactId} in org ${orgId}`);

    // Verify existing contact exists and user is permitted
    await this.getContactById(context, contactId);

    // If accountId is being changed, verify target account in same organization
    if (payload.accountId) {
      const { data: account } = await supabaseAdmin
        .from('accounts')
        .select('id')
        .eq('id', payload.accountId)
        .eq('organization_id', orgId)
        .eq('is_deleted', false)
        .maybeSingle();

      if (!account) {
        throw new Error('Associated account does not exist or belongs to another organization');
      }
    }

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
    if (payload.accountId !== undefined) updateData.account_id = payload.accountId || null;
    if (payload.firstName !== undefined) updateData.first_name = payload.firstName ? payload.firstName.trim() : null;
    if (payload.lastName !== undefined) updateData.last_name = payload.lastName.trim();
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.department !== undefined) updateData.department = payload.department;
    if (payload.email !== undefined) updateData.email = payload.email ? payload.email.trim().toLowerCase() : null;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.mobile !== undefined) updateData.mobile = payload.mobile;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.mailingStreet !== undefined) updateData.mailing_street = payload.mailingStreet;
    if (payload.mailingCity !== undefined) updateData.mailing_city = payload.mailingCity;
    if (payload.mailingState !== undefined) updateData.mailing_state = payload.mailingState;
    if (payload.mailingCountry !== undefined) updateData.mailing_country = payload.mailingCountry;
    if (payload.mailingPostalCode !== undefined) updateData.mailing_postal_code = payload.mailingPostalCode;
    if (payload.otherStreet !== undefined) updateData.other_street = payload.otherStreet;
    if (payload.otherCity !== undefined) updateData.other_city = payload.otherCity;
    if (payload.otherState !== undefined) updateData.other_state = payload.otherState;
    if (payload.otherCountry !== undefined) updateData.other_country = payload.otherCountry;
    if (payload.otherPostalCode !== undefined) updateData.other_postal_code = payload.otherPostalCode;
    if (payload.ownerUserId !== undefined) updateData.owner_user_id = payload.ownerUserId;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('contacts')
      .update(updateData)
      .eq('id', contactId)
      .eq('organization_id', orgId)
      .select('*, accounts!account_id(id, name), profiles!owner_user_id(id, full_name, email)')
      .single();

    if (updateError || !updated) {
      Logger.error(`[ContactsService.updateContact] Update failed: ${updateError?.message}`);
      throw new Error(`Failed to update contact: ${updateError?.message}`);
    }

    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'CONTACT_UPDATED',
      resource: 'contacts',
      resourceId: contactId,
      metadata: { fields: Object.keys(updateData) },
    });

    return this.mapDbContact(updated);
  }

  // Step 5: Soft delete contact
  public static async deleteContact(
    context: AuthUserContext,
    contactId: string
  ): Promise<{ id: string; success: boolean }> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    Logger.info(`[ContactsService.deleteContact] Step 5: Soft-deleting contact ${contactId} in org ${orgId}`);

    // Role check: Only ADMIN or MANAGER can delete
    if (context.role !== 'ADMIN' && context.role !== 'MANAGER') {
      Logger.warn(`[ContactsService.deleteContact] User ${context.id} with role ${context.role} denied deletion`);
      throw new Error('You do not have permission to delete contacts');
    }

    const { error } = await supabaseAdmin
      .from('contacts')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('organization_id', orgId);

    if (error) {
      Logger.error(`[ContactsService.deleteContact] Soft delete failed: ${error.message}`);
      throw new Error(`Failed to delete contact: ${error.message}`);
    }

    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'CONTACT_DELETED',
      resource: 'contacts',
      resourceId: contactId,
      metadata: { softDelete: true },
    });

    Logger.info(`[ContactsService.deleteContact] Contact ${contactId} marked as deleted`);
    return { id: contactId, success: true };
  }

  // Helper mapper
  private static mapDbContact(c: any): ContactEntity {
    return {
      id: c.id,
      organizationId: c.organization_id,
      accountId: c.account_id,
      ownerUserId: c.owner_user_id,
      createdBy: c.created_by,
      firstName: c.first_name,
      lastName: c.last_name,
      title: c.title,
      department: c.department,
      email: c.email,
      phone: c.phone,
      mobile: c.mobile,
      description: c.description,
      mailingStreet: c.mailing_street,
      mailingCity: c.mailing_city,
      mailingState: c.mailing_state,
      mailingCountry: c.mailing_country,
      mailingPostalCode: c.mailing_postal_code,
      otherStreet: c.other_street,
      otherCity: c.other_city,
      otherState: c.other_state,
      otherCountry: c.other_country,
      otherPostalCode: c.other_postal_code,
      isDeleted: c.is_deleted,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      account: c.accounts
        ? {
            id: c.accounts.id,
            name: c.accounts.name,
          }
        : null,
      owner: c.profiles
        ? {
            id: c.profiles.id,
            fullName: c.profiles.full_name,
            email: c.profiles.email,
          }
        : undefined,
    };
  }
}
