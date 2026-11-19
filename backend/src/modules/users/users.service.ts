import { supabaseAdmin } from '../../config/supabase.js';
import { AuthUserContext, InviteUserDTO, UpdateUserRoleDTO, UpdateUserStatusDTO } from '../../types/api.types.js';
import { AuditService } from '../../services/audit.service.js';
import { Logger } from '../../utils/logger.js';
import { RoleName } from '../../types/db.types.js';

// =============================================================================
// Users Service
// Manages organization user directory, role governance, and secure invitations
// =============================================================================

export class UsersService {
  // Step 1: List organization members with search, filters, and pagination
  public static async listMembers(
    context: AuthUserContext,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      role?: RoleName;
      status?: 'active' | 'deactivated' | 'pending';
    }
  ) {
    if (!context.activeOrganization) {
      throw new Error('Active organization context is required');
    }

    const orgId = context.activeOrganization.id;
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    Logger.info(
      `[UsersService.listMembers] Step 1: Querying members for org ${orgId} (Page=${page}, Limit=${limit}, Search="${options.search || ''}", Role=${options.role || 'ALL'}, Status=${options.status || 'ALL'})`
    );

    // Build base query
    let query = supabaseAdmin
      .from('organization_members')
      .select(
        `
        id,
        organization_id,
        user_id,
        role_id,
        is_active,
        invitation_status,
        invited_by,
        invited_at,
        joined_at,
        created_at,
        updated_at,
        profiles!user_id!inner (id, full_name, email, avatar_url, is_active, invitation_status),
        roles!inner (id, name, description)
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId);

    // Filter by role
    if (options.role) {
      query = query.eq('roles.name', options.role);
    }

    // Filter by status
    if (options.status === 'active') {
      query = query.eq('is_active', true).eq('invitation_status', 'ACCEPTED');
    } else if (options.status === 'deactivated') {
      query = query.eq('is_active', false);
    } else if (options.status === 'pending') {
      query = query.eq('invitation_status', 'PENDING');
    }

    // Apply search filter
    if (options.search && options.search.trim().length > 0) {
      const searchTerm = options.search.trim();
      Logger.debug(`[UsersService.listMembers] Applying search filter for: "${searchTerm}"`);
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`, {
        foreignTable: 'profiles!user_id',
      });
    }

    // Pagination and sorting
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: members, count, error } = await query;

    if (error) {
      Logger.error(`[UsersService.listMembers] Database error: ${error.message}`);
      throw new Error(`Failed to list organization members: ${error.message}`);
    }

    Logger.info(
      `[UsersService.listMembers] Step 1 completed: Retrieved ${members?.length || 0} records (Total: ${count || 0})`
    );

    // Format DTO
    const formattedMembers = (members || []).map((m: any) => ({
      membershipId: m.id,
      userId: m.user_id,
      fullName: m.profiles?.full_name,
      email: m.profiles?.email,
      avatarUrl: m.profiles?.avatar_url,
      role: m.roles?.name,
      roleDescription: m.roles?.description,
      isMemberActive: m.is_active,
      isProfileActive: m.profiles?.is_active,
      invitationStatus: m.invitation_status || m.profiles?.invitation_status || 'ACCEPTED',
      invitedBy: m.invited_by,
      invitedAt: m.invited_at,
      joinedAt: m.joined_at,
    }));

    return {
      members: formattedMembers,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // Step 2: Retrieve single organization member details
  public static async getMemberById(context: AuthUserContext, targetUserId: string) {
    if (!context.activeOrganization) throw new Error('Active organization context is required');
    const orgId = context.activeOrganization.id;
    Logger.info(`[UsersService.getMemberById] Querying member ${targetUserId} in org ${orgId}`);

    const { data: member, error } = await supabaseAdmin
      .from('organization_members')
      .select(
        `
        id,
        organization_id,
        user_id,
        role_id,
        is_active,
        invitation_status,
        invited_by,
        invited_at,
        joined_at,
        created_at,
        updated_at,
        profiles!user_id!inner (id, full_name, email, avatar_url, is_active, invitation_status),
        roles!inner (id, name, description)
      `
      )
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId)
      .single();

    if (error || !member) {
      Logger.warn(`[UsersService.getMemberById] Member ${targetUserId} not found in org ${orgId}`);
      throw new Error('Organization member not found');
    }

    const m = member as any;
    return {
      membershipId: m.id,
      userId: m.user_id,
      fullName: m.profiles?.full_name,
      email: m.profiles?.email,
      avatarUrl: m.profiles?.avatar_url,
      role: m.roles?.name,
      roleDescription: m.roles?.description,
      isMemberActive: m.is_active,
      isProfileActive: m.profiles?.is_active,
      invitationStatus: m.invitation_status,
      invitedBy: m.invited_by,
      invitedAt: m.invited_at,
      joinedAt: m.joined_at,
      updatedAt: m.updated_at,
    };
  }

  // Step 3: Invite new user to the organization
  public static async inviteUser(context: AuthUserContext, dto: InviteUserDTO) {
    if (!context.activeOrganization) {
      throw new Error('Active organization context required to invite users');
    }

    const orgId = context.activeOrganization.id;
    const orgName = context.activeOrganization.name;
    const email = dto.email.trim().toLowerCase();

    Logger.info(`[UsersService.inviteUser] Step 1: Admin ${context.id} inviting "${email}" with role "${dto.role}" to org ${orgId}`);

    // Rule 1: Cannot invite yourself
    if (email === context.email.toLowerCase()) {
      Logger.warn('[UsersService.inviteUser] Security check failed: User attempted to invite self');
      throw new Error('You cannot invite yourself to your own organization.');
    }

    // Rule 2: Verify target organization is active
    if (context.activeOrganization.status === 'SUSPENDED') {
      throw new Error('Cannot invite users to a suspended organization.');
    }

    // Step 2: Check for existing organization membership
    Logger.info('[UsersService.inviteUser] Step 2: Checking for existing organization membership...');
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      const { data: existingMember } = await supabaseAdmin
        .from('organization_members')
        .select('id, is_active')
        .eq('organization_id', orgId)
        .eq('user_id', existingProfile.id)
        .maybeSingle();

      if (existingMember && existingMember.is_active) {
        Logger.warn(`[UsersService.inviteUser] User ${email} is already an active member of org ${orgId}`);
        throw new Error('A user with this email address is already an active member of this organization.');
      }
    }

    // Step 3: Resolve requested role ID
    Logger.info(`[UsersService.inviteUser] Step 3: Resolving role definition for "${dto.role}"...`);
    const { data: roleRecord, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .eq('name', dto.role)
      .single();

    if (roleError || !roleRecord) {
      throw new Error(`Invalid role specified: ${dto.role}`);
    }

    // Step 4: Dispatch Supabase Auth invitation
    Logger.info(`[UsersService.inviteUser] Step 4: Dispatching Supabase Auth invitation email to ${email}...`);
    let invitedUserId: string;

    // Check if auth account already exists
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuth = userList?.users.find((u) => u.email?.toLowerCase() === email);

    if (existingAuth) {
      invitedUserId = existingAuth.id;
      Logger.info(`[UsersService.inviteUser] Reusing existing Supabase Auth user ID: ${invitedUserId}`);
    } else {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            full_name: dto.fullName,
            organization_id: orgId,
            organization_name: orgName,
            invited_by: context.id,
          },
        }
      );

      if (inviteError || !inviteData.user) {
        Logger.warn(`[UsersService.inviteUser] inviteUserByEmail note: ${inviteError?.message}. Creating placeholder user...`);
        const tempPassword = `Nexora@${Math.random().toString(36).substring(2, 10)}!`;
        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: false,
          user_metadata: { full_name: dto.fullName },
        });

        if (createError || !createdUser.user) {
          throw new Error(`Failed to create invitation account: ${createError?.message || inviteError?.message}`);
        }
        invitedUserId = createdUser.user.id;
      } else {
        invitedUserId = inviteData.user.id;
      }
    }

    // Step 5: Upsert user profile
    Logger.info('[UsersService.inviteUser] Step 5: Upserting user profile record...');
    await supabaseAdmin.from('profiles').upsert({
      id: invitedUserId,
      full_name: dto.fullName,
      email,
      is_active: true,
      invitation_status: 'PENDING',
      updated_at: new Date().toISOString(),
    });

    // Step 6: Create or update organization membership with PENDING status
    Logger.info('[UsersService.inviteUser] Step 6: Creating organization membership record...');
    const { data: member, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .upsert(
        {
          organization_id: orgId,
          user_id: invitedUserId,
          role_id: roleRecord.id,
          is_active: true,
          invitation_status: 'PENDING',
          invited_by: context.id,
          invited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,user_id' }
      )
      .select('id, organization_id, user_id, role_id, is_active, invitation_status, invited_at')
      .single();

    if (memberError) {
      Logger.error(`[UsersService.inviteUser] Failed to save membership: ${memberError.message}`);
      throw new Error(`Failed to establish organization membership: ${memberError.message}`);
    }

    // Step 7: Record audit log
    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'MEMBER_INVITED',
      resource: 'organization_members',
      resourceId: member?.id,
      metadata: {
        invited_email: email,
        invited_name: dto.fullName,
        assigned_role: dto.role,
        invited_by: context.id,
      },
    });

    Logger.info(`[UsersService.inviteUser] Step 7 completed: Invitation successfully issued to ${email}`);

    return {
      membershipId: member?.id,
      userId: invitedUserId,
      fullName: dto.fullName,
      email,
      role: dto.role,
      invitationStatus: 'PENDING',
      invitedAt: member?.invited_at,
    };
  }

  // Step 4: Resend invitation email
  public static async resendInvitation(context: AuthUserContext, targetUserId: string) {
    if (!context.activeOrganization) throw new Error('Active organization context required');
    const orgId = context.activeOrganization.id;

    Logger.info(`[UsersService.resendInvitation] Resending invitation to user ${targetUserId} in org ${orgId}`);

    // Fetch member
    const { data: member, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('id, user_id, invitation_status, profiles!user_id(email, full_name)')
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId)
      .single();

    if (memberError || !member) {
      throw new Error('Member not found in this organization');
    }

    const email = (member as any).profiles?.email;
    const fullName = (member as any).profiles?.full_name;

    if (!email) throw new Error('Target user email address not found');

    // Trigger Supabase invitation email
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        organization_id: orgId,
        organization_name: context.activeOrganization.name,
      },
    });

    if (inviteError) {
      Logger.warn(`[UsersService.resendInvitation] inviteUserByEmail note: ${inviteError.message}`);
    }

    // Update invited_at timestamp
    const now = new Date().toISOString();
    await supabaseAdmin
      .from('organization_members')
      .update({
        invited_at: now,
        invitation_status: 'PENDING',
        updated_at: now,
      })
      .eq('id', member.id);

    // Record audit log
    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'INVITATION_RESENT',
      resource: 'organization_members',
      resourceId: member.id,
      metadata: { target_email: email, target_user_id: targetUserId },
    });

    Logger.info(`[UsersService.resendInvitation] Invitation resent to ${email}`);

    return {
      success: true,
      message: `Invitation resent successfully to ${email}`,
      invitedAt: now,
    };
  }

  // Step 5: Update organization member role
  public static async updateMemberRole(
    context: AuthUserContext,
    targetUserId: string,
    dto: UpdateUserRoleDTO
  ) {
    if (!context.activeOrganization) throw new Error('Active organization context required');
    const orgId = context.activeOrganization.id;

    Logger.info(
      `[UsersService.updateMemberRole] Step 1: Admin ${context.id} requesting role change for user ${targetUserId} to ${dto.role}`
    );

    // Rule: User cannot modify their own role
    if (context.id === targetUserId) {
      Logger.warn(`[UsersService.updateMemberRole] Security violation: User ${context.id} tried to modify own role`);
      throw new Error('Users are not permitted to modify their own role.');
    }

    // Verify target user belongs to current organization
    const { data: targetMember, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('id, user_id, role_id, roles(id, name)')
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId)
      .single();

    if (memberError || !targetMember) {
      Logger.warn(`[UsersService.updateMemberRole] Target member ${targetUserId} not found in org ${orgId}`);
      throw new Error('Target user does not belong to this organization.');
    }

    const currentTargetRole = (targetMember.roles as any)?.name;

    // If demoting an ADMIN, ensure at least one other active admin remains
    if (currentTargetRole === 'ADMIN' && dto.role !== 'ADMIN') {
      const { data: adminRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'ADMIN')
        .single();

      if (adminRole) {
        const { count: adminCount } = await supabaseAdmin
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('role_id', adminRole.id)
          .eq('is_active', true);

        if ((adminCount || 0) <= 1) {
          throw new Error('Cannot demote the only remaining active Administrator in this organization.');
        }
      }
    }

    // Resolve new role ID
    const { data: newRole, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .eq('name', dto.role)
      .single();

    if (roleError || !newRole) {
      throw new Error(`Invalid role specified: ${dto.role}`);
    }

    // Update role
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from('organization_members')
      .update({
        role_id: newRole.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetMember.id)
      .select('id, organization_id, user_id, role_id, is_active, updated_at')
      .single();

    if (updateError || !updatedMember) {
      throw new Error('Failed to update member role');
    }

    // Record audit log
    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'MEMBER_ROLE_UPDATED',
      resource: 'organization_members',
      resourceId: targetMember.id,
      metadata: {
        target_user_id: targetUserId,
        previous_role: currentTargetRole,
        new_role: dto.role,
        performed_by: context.id,
      },
    });

    Logger.info(`[UsersService.updateMemberRole] Role updated for ${targetUserId} to ${dto.role}`);

    return {
      membershipId: updatedMember.id,
      userId: targetUserId,
      role: dto.role,
      updatedAt: updatedMember.updated_at,
    };
  }

  // Step 6: Update member active/inactive status
  public static async updateMemberStatus(
    context: AuthUserContext,
    targetUserId: string,
    dto: UpdateUserStatusDTO
  ) {
    if (!context.activeOrganization) throw new Error('Active organization context required');
    const orgId = context.activeOrganization.id;

    Logger.info(
      `[UsersService.updateMemberStatus] Step 1: Admin ${context.id} requesting status change for ${targetUserId} to isActive=${dto.isActive}`
    );

    // Rule: User cannot deactivate themselves
    if (context.id === targetUserId && !dto.isActive) {
      throw new Error('You cannot deactivate your own account.');
    }

    const { data: targetMember, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('id, user_id, role_id, is_active, roles(name)')
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId)
      .single();

    if (memberError || !targetMember) {
      throw new Error('Target user does not belong to this organization.');
    }

    // Prevent deactivating last active admin
    const targetRole = (targetMember.roles as any)?.name;
    if (targetRole === 'ADMIN' && !dto.isActive) {
      const { data: adminRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'ADMIN')
        .single();

      if (adminRole) {
        const { count: adminCount } = await supabaseAdmin
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('role_id', adminRole.id)
          .eq('is_active', true);

        if ((adminCount || 0) <= 1) {
          throw new Error('Cannot deactivate the only active Administrator in this organization.');
        }
      }
    }

    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from('organization_members')
      .update({
        is_active: dto.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetMember.id)
      .select('id, is_active, updated_at')
      .single();

    if (updateError || !updatedMember) {
      throw new Error('Failed to update member status');
    }

    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: dto.isActive ? 'MEMBER_ACTIVATED' : 'MEMBER_DEACTIVATED',
      resource: 'organization_members',
      resourceId: targetMember.id,
      metadata: {
        target_user_id: targetUserId,
        previous_status: targetMember.is_active,
        new_status: dto.isActive,
        performed_by: context.id,
      },
    });

    return {
      membershipId: updatedMember.id,
      userId: targetUserId,
      isActive: updatedMember.is_active,
      updatedAt: updatedMember.updated_at,
    };
  }
}
