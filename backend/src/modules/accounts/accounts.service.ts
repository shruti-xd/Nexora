import { supabaseAdmin } from '../../config/supabase.js';
import { AuthUserContext } from '../../types/api.types.js';
import { AccountEntity, AccountQueryOptions, ContactEntity } from '../../types/crm.types.js';
import { Logger } from '../../utils/logger.js';
import { AuditService } from '../../services/audit.service.js';

// =============================================================================
// Accounts Service
// Business logic, data isolation, and query execution for Accounts
// =============================================================================

export class AccountsService {
  // Step 1: Create a new account within the authenticated organization
  public static async createAccount(
    context: AuthUserContext,
    payload: any
  ): Promise<AccountEntity> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    const ownerUserId = payload.ownerUserId || context.id;

    Logger.info(
      `[AccountsService.createAccount] Step 1: Creating account "${payload.name}" for org ${orgId} (Owner: ${ownerUserId})`
    );

    // Step 1.1: If custom owner specified, verify owner belongs to same organization
    if (payload.ownerUserId && payload.ownerUserId !== context.id) {
      Logger.debug(`[AccountsService.createAccount] Step 1.1: Verifying owner ${payload.ownerUserId} membership`);
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

    // Step 1.2: Insert account record
    const { data: account, error: insertError } = await supabaseAdmin
      .from('accounts')
      .insert({
        organization_id: orgId,
        owner_user_id: ownerUserId,
        created_by: context.id,
        name: payload.name.trim(),
        account_type: payload.accountType || 'PROSPECT',
        industry: payload.industry || null,
        website: payload.website || null,
        phone: payload.phone || null,
        email: payload.email ? payload.email.trim().toLowerCase() : null,
        annual_revenue: payload.annualRevenue || null,
        employee_count: payload.employeeCount || null,
        description: payload.description || null,
        billing_street: payload.billingStreet || null,
        billing_city: payload.billingCity || null,
        billing_state: payload.billingState || null,
        billing_country: payload.billingCountry || null,
        billing_postal_code: payload.billingPostalCode || null,
        shipping_street: payload.shippingStreet || null,
        shipping_city: payload.shippingCity || null,
        shipping_state: payload.shippingState || null,
        shipping_country: payload.shippingCountry || null,
        shipping_postal_code: payload.shippingPostalCode || null,
        is_deleted: false,
      })
      .select('*, profiles!owner_user_id(id, full_name, email)')
      .single();

    if (insertError || !account) {
      Logger.error(`[AccountsService.createAccount] Step 1: Insert failed: ${insertError?.message}`);
      throw new Error(`Failed to create account: ${insertError?.message}`);
    }

    // Step 1.3: Audit log
    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'ACCOUNT_CREATED',
      resource: 'accounts',
      resourceId: account.id,
      metadata: { name: account.name, accountType: account.account_type },
    });

    Logger.info(`[AccountsService.createAccount] Step 1: Account created successfully: ${account.id}`);

    return this.mapDbAccount(account);
  }

  // Step 2: List accounts with search, filters, pagination, and contact counts
  public static async listAccounts(
    context: AuthUserContext,
    options: AccountQueryOptions
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
      `[AccountsService.listAccounts] Step 2: Listing accounts for org ${orgId} (Page=${page}, Limit=${limit}, Search="${options.search || ''}")`
    );

    // Build base query
    let query = supabaseAdmin
      .from('accounts')
      .select(
        '*, profiles!owner_user_id(id, full_name, email)',
        { count: 'exact' }
      )
      .eq('organization_id', orgId)
      .eq('is_deleted', false);

    // SALES_REP scoping: can only see their own accounts if non-manager/non-admin
    if (context.role === 'SALES_REP') {
      Logger.debug(`[AccountsService.listAccounts] Applying SALES_REP ownership restriction: owner=${context.id}`);
      query = query.eq('owner_user_id', context.id);
    } else if (options.ownerId) {
      query = query.eq('owner_user_id', options.ownerId);
    }

    // Filter by accountType
    if (options.accountType) {
      query = query.eq('account_type', options.accountType);
    }

    // Filter by industry
    if (options.industry) {
      query = query.ilike('industry', `%${options.industry}%`);
    }

    // Global Search
    if (options.search && options.search.trim().length > 0) {
      const term = options.search.trim();
      query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,billing_city.ilike.%${term}%`);
    }

    // Sorting & Pagination
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data: accounts, error, count } = await query;

    if (error) {
      Logger.error(`[AccountsService.listAccounts] Query failed: ${error.message}`);
      throw new Error(`Failed to list accounts: ${error.message}`);
    }

    // Step 2.1: Fetch Contact counts for listed accounts
    const accountIds = (accounts || []).map((a) => a.id);
    const contactCountsMap: Record<string, number> = {};

    if (accountIds.length > 0) {
      const { data: contactsGroup } = await supabaseAdmin
        .from('contacts')
        .select('account_id')
        .in('account_id', accountIds)
        .eq('is_deleted', false);

      if (contactsGroup) {
        contactsGroup.forEach((c) => {
          if (c.account_id) {
            contactCountsMap[c.account_id] = (contactCountsMap[c.account_id] || 0) + 1;
          }
        });
      }
    }

    const mappedAccounts: AccountEntity[] = (accounts || []).map((a) => ({
      ...this.mapDbAccount(a),
      contactCount: contactCountsMap[a.id] || 0,
    }));

    Logger.info(
      `[AccountsService.listAccounts] Successfully retrieved ${mappedAccounts.length} accounts (Total: ${count || 0})`
    );

    return {
      accounts: mappedAccounts,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // Step 3: Get single account details by ID
  public static async getAccountById(
    context: AuthUserContext,
    accountId: string
  ): Promise<AccountEntity> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    Logger.info(`[AccountsService.getAccountById] Step 3: Querying account ${accountId} in org ${orgId}`);

    let query = supabaseAdmin
      .from('accounts')
      .select('*, profiles!owner_user_id(id, full_name, email)')
      .eq('id', accountId)
      .eq('organization_id', orgId)
      .eq('is_deleted', false);

    if (context.role === 'SALES_REP') {
      query = query.eq('owner_user_id', context.id);
    }

    const { data: account, error } = await query.single();

    if (error || !account) {
      Logger.warn(`[AccountsService.getAccountById] Account ${accountId} not found or unauthorized`);
      throw new Error('Account not found');
    }

    // Contact count
    const { count: contactCount } = await supabaseAdmin
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_deleted', false);

    return {
      ...this.mapDbAccount(account),
      contactCount: contactCount || 0,
    };
  }

  // Step 4: Update an existing account
  public static async updateAccount(
    context: AuthUserContext,
    accountId: string,
    payload: any
  ): Promise<AccountEntity> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    Logger.info(`[AccountsService.updateAccount] Step 4: Updating account ${accountId} in org ${orgId}`);

    // Verify existing account exists and user is permitted
    await this.getAccountById(context, accountId);

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
    if (payload.name !== undefined) updateData.name = payload.name.trim();
    if (payload.accountType !== undefined) updateData.account_type = payload.accountType;
    if (payload.industry !== undefined) updateData.industry = payload.industry;
    if (payload.website !== undefined) updateData.website = payload.website;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.email !== undefined) updateData.email = payload.email ? payload.email.trim().toLowerCase() : null;
    if (payload.annualRevenue !== undefined) updateData.annual_revenue = payload.annualRevenue;
    if (payload.employeeCount !== undefined) updateData.employee_count = payload.employeeCount;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.billingStreet !== undefined) updateData.billing_street = payload.billingStreet;
    if (payload.billingCity !== undefined) updateData.billing_city = payload.billingCity;
    if (payload.billingState !== undefined) updateData.billing_state = payload.billingState;
    if (payload.billingCountry !== undefined) updateData.billing_country = payload.billingCountry;
    if (payload.billingPostalCode !== undefined) updateData.billing_postal_code = payload.billingPostalCode;
    if (payload.shippingStreet !== undefined) updateData.shipping_street = payload.shippingStreet;
    if (payload.shippingCity !== undefined) updateData.shipping_city = payload.shippingCity;
    if (payload.shippingState !== undefined) updateData.shipping_state = payload.shippingState;
    if (payload.shippingCountry !== undefined) updateData.shipping_country = payload.shippingCountry;
    if (payload.shippingPostalCode !== undefined) updateData.shipping_postal_code = payload.shippingPostalCode;
    if (payload.ownerUserId !== undefined) updateData.owner_user_id = payload.ownerUserId;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('accounts')
      .update(updateData)
      .eq('id', accountId)
      .eq('organization_id', orgId)
      .select('*, profiles!owner_user_id(id, full_name, email)')
      .single();

    if (updateError || !updated) {
      Logger.error(`[AccountsService.updateAccount] Update failed: ${updateError?.message}`);
      throw new Error(`Failed to update account: ${updateError?.message}`);
    }

    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'ACCOUNT_UPDATED',
      resource: 'accounts',
      resourceId: accountId,
      metadata: { fields: Object.keys(updateData) },
    });

    return this.mapDbAccount(updated);
  }

  // Step 5: Soft delete account
  public static async deleteAccount(
    context: AuthUserContext,
    accountId: string
  ): Promise<{ id: string; success: boolean }> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    Logger.info(`[AccountsService.deleteAccount] Step 5: Soft-deleting account ${accountId} in org ${orgId}`);

    // Only ADMIN or MANAGER can delete records per specification
    if (context.role !== 'ADMIN' && context.role !== 'MANAGER') {
      Logger.warn(`[AccountsService.deleteAccount] User ${context.id} with role ${context.role} denied deletion`);
      throw new Error('You do not have permission to delete accounts');
    }

    const { error } = await supabaseAdmin
      .from('accounts')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', accountId)
      .eq('organization_id', orgId);

    if (error) {
      Logger.error(`[AccountsService.deleteAccount] Soft delete failed: ${error.message}`);
      throw new Error(`Failed to delete account: ${error.message}`);
    }

    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'ACCOUNT_DELETED',
      resource: 'accounts',
      resourceId: accountId,
      metadata: { softDelete: true },
    });

    Logger.info(`[AccountsService.deleteAccount] Account ${accountId} marked as deleted`);
    return { id: accountId, success: true };
  }

  // Step 6: Get associated contacts for an account
  public static async getAccountContacts(
    context: AuthUserContext,
    accountId: string
  ): Promise<ContactEntity[]> {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    Logger.info(`[AccountsService.getAccountContacts] Step 6: Querying contacts for account ${accountId}`);

    // Verify account exists in organization
    await this.getAccountById(context, accountId);

    const { data: contacts, error } = await supabaseAdmin
      .from('contacts')
      .select('*, profiles!owner_user_id(id, full_name, email)')
      .eq('account_id', accountId)
      .eq('organization_id', orgId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      Logger.error(`[AccountsService.getAccountContacts] Query failed: ${error.message}`);
      throw new Error(`Failed to retrieve account contacts: ${error.message}`);
    }

    return (contacts || []).map((c) => ({
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
      owner: c.profiles
        ? {
            id: c.profiles.id,
            fullName: c.profiles.full_name,
            email: c.profiles.email,
          }
        : undefined,
    }));
  }

  // Helper mapper
  private static mapDbAccount(a: any): AccountEntity {
    return {
      id: a.id,
      organizationId: a.organization_id,
      ownerUserId: a.owner_user_id,
      createdBy: a.created_by,
      name: a.name,
      accountType: a.account_type,
      industry: a.industry,
      website: a.website,
      phone: a.phone,
      email: a.email,
      annualRevenue: a.annual_revenue ? parseFloat(a.annual_revenue) : null,
      employeeCount: a.employee_count,
      description: a.description,
      billingStreet: a.billing_street,
      billingCity: a.billing_city,
      billingState: a.billing_state,
      billingCountry: a.billing_country,
      billingPostalCode: a.billing_postal_code,
      shippingStreet: a.shipping_street,
      shippingCity: a.shipping_city,
      shippingState: a.shipping_state,
      shippingCountry: a.shipping_country,
      shippingPostalCode: a.shipping_postal_code,
      isDeleted: a.is_deleted,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      owner: a.profiles
        ? {
            id: a.profiles.id,
            fullName: a.profiles.full_name,
            email: a.profiles.email,
          }
        : undefined,
    };
  }
}
