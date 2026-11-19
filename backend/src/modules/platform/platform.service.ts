import { supabaseAdmin } from '../../config/supabase.js';
import {
  CreateOrganizationDTO,
  UpdateOrganizationDTO,
  UpdateOrganizationStatusDTO,
  AssignOrganizationAdminDTO,
  AuthUserContext,
} from '../../types/api.types.js';
import { slugify } from '../../utils/slugify.js';
import { AuditService } from '../../services/audit.service.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Platform Administration Service
// Manages organization provisioning, lifecycle governance, and admin assignments
// =============================================================================

export class PlatformService {
  // Step 1: Create a new tenant organization and provision the initial Organization Admin
  public static async createOrganization(context: AuthUserContext, dto: CreateOrganizationDTO) {
    Logger.info(`[PlatformService.createOrganization] Step 1: Platform Admin ${context.id} creating org "${dto.name}"`);

    // Step 2: Determine and validate unique organization slug
    const requestedSlug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    Logger.info(`[PlatformService.createOrganization] Step 2: Checking slug uniqueness for "${requestedSlug}"...`);

    let finalSlug = requestedSlug;
    let suffix = 1;
    while (true) {
      const { data: existingOrg } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle();

      if (!existingOrg) break;
      finalSlug = `${requestedSlug}-${suffix}`;
      suffix++;
    }

    Logger.info(`[PlatformService.createOrganization] Step 2 completed: Using unique slug "${finalSlug}"`);

    // Step 3: Insert the new organization row
    Logger.info('[PlatformService.createOrganization] Step 3: Creating organization record in database...');
    const { data: newOrg, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: dto.name,
        slug: finalSlug,
        status: 'ACTIVE',
        created_by: context.id,
      })
      .select('*')
      .single();

    if (orgError || !newOrg) {
      Logger.error(`[PlatformService.createOrganization] Failed to create organization: ${orgError?.message}`);
      throw new Error(`Failed to create organization: ${orgError?.message}`);
    }

    const orgId = newOrg.id;
    Logger.info(`[PlatformService.createOrganization] Step 3 completed: Organization created with ID: ${orgId}`);

    // Step 4: Provision or invite the initial Organization Admin
    const adminEmail = dto.adminEmail.trim().toLowerCase();
    Logger.info(`[PlatformService.createOrganization] Step 4: Provisioning initial Admin for email: ${adminEmail}`);

    let adminUserId: string;

    // Check if user already exists in Supabase Auth
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuth = userList?.users.find((u) => u.email?.toLowerCase() === adminEmail);

    if (existingAuth) {
      adminUserId = existingAuth.id;
      Logger.info(`[PlatformService.createOrganization] Found existing auth user ID: ${adminUserId}`);
    } else {
      // Invite user via Supabase Auth Admin API
      Logger.info('[PlatformService.createOrganization] Dispatching Supabase Auth invitation email...');
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        adminEmail,
        {
          data: {
            full_name: dto.adminFullName,
            organization_id: orgId,
            organization_name: dto.name,
          },
        }
      );

      if (inviteError || !inviteData.user) {
        Logger.warn(`[PlatformService.createOrganization] inviteUserByEmail note: ${inviteError?.message}. Falling back to createUser...`);
        // Fallback: create user if email invitation is throttled or requires SMTP setup
        const tempPassword = `Nexora@${Math.random().toString(36).substring(2, 10)}!`;
        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: adminEmail,
          password: tempPassword,
          email_confirm: false,
          user_metadata: { full_name: dto.adminFullName },
        });

        if (createError || !createdUser.user) {
          // Rollback organization creation
          await supabaseAdmin.from('organizations').delete().eq('id', orgId);
          throw new Error(`Failed to provision admin account: ${createError?.message || inviteError?.message}`);
        }
        adminUserId = createdUser.user.id;
      } else {
        adminUserId = inviteData.user.id;
      }
    }

    // Step 5: Upsert user profile
    Logger.info('[PlatformService.createOrganization] Step 5: Upserting user profile record...');
    await supabaseAdmin.from('profiles').upsert({
      id: adminUserId,
      full_name: dto.adminFullName,
      email: adminEmail,
      is_active: true,
      invitation_status: 'PENDING',
      updated_at: new Date().toISOString(),
    });

    // Step 6: Fetch ADMIN role ID
    Logger.info('[PlatformService.createOrganization] Step 6: Resolving ADMIN role ID...');
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'ADMIN')
      .single();

    if (roleError || !adminRole) {
      throw new Error('ADMIN role definition missing from database');
    }

    // Step 7: Create organization membership
    Logger.info('[PlatformService.createOrganization] Step 7: Establishing organization membership with ADMIN role...');
    const { data: member, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: adminUserId,
        role_id: adminRole.id,
        is_active: true,
        invitation_status: 'PENDING',
        invited_by: context.id,
        invited_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (memberError) {
      Logger.error(`[PlatformService.createOrganization] Failed to create membership: ${memberError.message}`);
      throw new Error(`Failed to assign organization administrator: ${memberError.message}`);
    }

    // Step 8: Log audit trail
    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'ORGANIZATION_CREATED',
      resource: 'organizations',
      resourceId: orgId,
      metadata: {
        organization_name: dto.name,
        organization_slug: finalSlug,
        initial_admin_email: adminEmail,
        initial_admin_id: adminUserId,
      },
    });

    Logger.info(`[PlatformService.createOrganization] Step 8 completed: Organization "${dto.name}" provisioned successfully`);

    return {
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        slug: newOrg.slug,
        status: newOrg.status,
        createdAt: newOrg.created_at,
      },
      admin: {
        id: adminUserId,
        fullName: dto.adminFullName,
        email: adminEmail,
        role: 'ADMIN',
        invitationStatus: 'PENDING',
      },
      membershipId: member?.id,
    };
  }

  // Step 2: List all tenant organizations with search, status filtering, and pagination
  public static async listOrganizations(
    options: { page?: number; limit?: number; search?: string; status?: string }
  ) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    Logger.info(`[PlatformService.listOrganizations] Querying organizations (Page=${page}, Limit=${limit}, Search="${options.search || ''}")`);

    let query = supabaseAdmin
      .from('organizations')
      .select('id, name, slug, status, created_by, created_at, updated_at', { count: 'exact' });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.search && options.search.trim().length > 0) {
      const term = options.search.trim();
      query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: organizations, count, error } = await query;

    if (error) {
      Logger.error(`[PlatformService.listOrganizations] Database error: ${error.message}`);
      throw new Error(`Failed to list organizations: ${error.message}`);
    }

    // Fetch member counts and primary administrators for each organization
    const orgsWithDetails = await Promise.all(
      (organizations || []).map(async (org) => {
        // Count active members
        const { count: memberCount } = await supabaseAdmin
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('is_active', true);

        // Fetch Organization Admin
        const { data: adminMember } = await supabaseAdmin
          .from('organization_members')
          .select('user_id, profiles!user_id(full_name, email), roles!inner(name)')
          .eq('organization_id', org.id)
          .eq('roles.name', 'ADMIN')
          .limit(1)
          .maybeSingle();

        const adminProfile = (adminMember as any)?.profiles;

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          status: org.status,
          memberCount: memberCount || 0,
          admin: adminProfile
            ? {
                id: (adminMember as any).user_id,
                fullName: adminProfile.full_name,
                email: adminProfile.email,
              }
            : null,
          createdAt: org.created_at,
          updatedAt: org.updated_at,
        };
      })
    );

    return {
      organizations: orgsWithDetails,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // Step 3: Get single organization details by ID
  public static async getOrganizationById(orgId: string) {
    Logger.info(`[PlatformService.getOrganizationById] Querying organization: ${orgId}`);

    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      Logger.warn(`[PlatformService.getOrganizationById] Organization ${orgId} not found`);
      throw new Error('Organization not found');
    }

    // Get active member count
    const { count: memberCount } = await supabaseAdmin
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true);

    // Get all admins
    const { data: adminMembers } = await supabaseAdmin
      .from('organization_members')
      .select('user_id, profiles!user_id(full_name, email, is_active), roles!inner(name)')
      .eq('organization_id', orgId)
      .eq('roles.name', 'ADMIN');

    const admins = (adminMembers || []).map((m: any) => ({
      userId: m.user_id,
      fullName: m.profiles?.full_name,
      email: m.profiles?.email,
      isActive: m.profiles?.is_active,
    }));

    return {
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        createdAt: org.created_at,
        updatedAt: org.updated_at,
        memberCount: memberCount || 0,
      },
      administrators: admins,
    };
  }

  // Step 4: Update organization metadata (name, slug)
  public static async updateOrganization(
    context: AuthUserContext,
    orgId: string,
    dto: UpdateOrganizationDTO
  ) {
    Logger.info(`[PlatformService.updateOrganization] Updating org ${orgId}`);

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name) updates.name = dto.name;
    if (dto.slug) {
      const cleanSlug = slugify(dto.slug);
      // Verify uniqueness
      const { data: existing } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('slug', cleanSlug)
        .neq('id', orgId)
        .maybeSingle();

      if (existing) {
        throw new Error(`Slug "${cleanSlug}" is already in use by another organization`);
      }
      updates.slug = cleanSlug;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select('*')
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update organization: ${error?.message}`);
    }

    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'ORGANIZATION_UPDATED_BY_PLATFORM_ADMIN',
      resource: 'organizations',
      resourceId: orgId,
      metadata: updates,
    });

    return updated;
  }

  // Step 5: Update organization status (ACTIVE / SUSPENDED)
  public static async updateOrganizationStatus(
    context: AuthUserContext,
    orgId: string,
    dto: UpdateOrganizationStatusDTO
  ) {
    Logger.info(`[PlatformService.updateOrganizationStatus] Setting org ${orgId} status to "${dto.status}"`);

    const { data: updated, error } = await supabaseAdmin
      .from('organizations')
      .update({
        status: dto.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select('id, name, slug, status, updated_at')
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update organization status: ${error?.message}`);
    }

    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: dto.status === 'SUSPENDED' ? 'ORGANIZATION_SUSPENDED' : 'ORGANIZATION_ACTIVATED',
      resource: 'organizations',
      resourceId: orgId,
      metadata: { new_status: dto.status, performed_by: context.id },
    });

    Logger.info(`[PlatformService.updateOrganizationStatus] Organization ${orgId} status updated to ${dto.status}`);

    return updated;
  }

  // Step 6: Assign or invite an Organization Admin to an existing organization
  public static async assignOrganizationAdmin(
    context: AuthUserContext,
    orgId: string,
    dto: AssignOrganizationAdminDTO
  ) {
    Logger.info(`[PlatformService.assignOrganizationAdmin] Assigning admin "${dto.adminEmail}" to org ${orgId}`);

    // Verify organization exists
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      throw new Error('Organization not found');
    }

    const adminEmail = dto.adminEmail.trim().toLowerCase();
    let adminUserId: string;

    // Check existing auth
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuth = userList?.users.find((u) => u.email?.toLowerCase() === adminEmail);

    if (existingAuth) {
      adminUserId = existingAuth.id;
    } else {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        adminEmail,
        {
          data: {
            full_name: dto.adminFullName,
            organization_id: orgId,
            organization_name: org.name,
          },
        }
      );

      if (inviteError || !inviteData.user) {
        // Fallback to createUser
        const tempPassword = `Nexora@${Math.random().toString(36).substring(2, 10)}!`;
        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: adminEmail,
          password: tempPassword,
          user_metadata: { full_name: dto.adminFullName },
        });

        if (createError || !createdUser.user) {
          throw new Error(`Failed to provision admin account: ${createError?.message || inviteError?.message}`);
        }
        adminUserId = createdUser.user.id;
      } else {
        adminUserId = inviteData.user.id;
      }
    }

    // Upsert profile
    await supabaseAdmin.from('profiles').upsert({
      id: adminUserId,
      full_name: dto.adminFullName,
      email: adminEmail,
      is_active: true,
      invitation_status: 'PENDING',
      updated_at: new Date().toISOString(),
    });

    // Get ADMIN role
    const { data: adminRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'ADMIN')
      .single();

    if (!adminRole) throw new Error('ADMIN role not found');

    // Upsert membership
    const { data: member, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .upsert(
        {
          organization_id: orgId,
          user_id: adminUserId,
          role_id: adminRole.id,
          is_active: true,
          invitation_status: 'PENDING',
          invited_by: context.id,
          invited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,user_id' }
      )
      .select('*')
      .single();

    if (memberError) {
      throw new Error(`Failed to create organization membership: ${memberError.message}`);
    }

    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'ORGANIZATION_ADMIN_ASSIGNED',
      resource: 'organization_members',
      resourceId: member?.id,
      metadata: { target_admin_id: adminUserId, email: adminEmail },
    });

    return {
      membershipId: member?.id,
      userId: adminUserId,
      email: adminEmail,
      fullName: dto.adminFullName,
      role: 'ADMIN',
    };
  }
}
