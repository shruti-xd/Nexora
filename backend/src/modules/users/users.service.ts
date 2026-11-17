import { supabaseAdmin } from '../../config/supabase.js';
import { AuthUserContext, UpdateUserRoleDTO, UpdateUserStatusDTO } from '../../types/api.types.js';
import { AuditService } from '../../services/audit.service.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Users Service
// Manages team member listing, role assignment, and activation status
// =============================================================================

export class UsersService {
  // Step 1: List organization members with search and pagination
  public static async listMembers(
    context: AuthUserContext,
    options: { page?: number; limit?: number; search?: string }
  ) {
    const orgId = context.activeOrganization.id;
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    Logger.info(
      `[UsersService.listMembers] Step 1: Fetching members for org ${orgId} (Page=${page}, Limit=${limit}, Search="${options.search || ''}")`
    );

    // Build query for organization members joined with profiles and roles
    let query = supabaseAdmin
      .from('organization_members')
      .select(
        `
        id,
        organization_id,
        user_id,
        role_id,
        is_active,
        joined_at,
        created_at,
        updated_at,
        profiles!inner (id, full_name, email, avatar_url, is_active),
        roles!inner (id, name, description)
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId);

    // Step 2: Apply search filtering if provided
    if (options.search && options.search.trim().length > 0) {
      const searchTerm = options.search.trim();
      Logger.debug(`[UsersService.listMembers] Applying search filter for: "${searchTerm}"`);
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`, {
        foreignTable: 'profiles',
      });
    }

    // Step 3: Apply pagination and sorting
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: members, count, error } = await query;

    if (error) {
      Logger.error(`[UsersService.listMembers] Database error: ${error.message}`);
      throw new Error(`Failed to list organization members: ${error.message}`);
    }

    Logger.info(
      `[UsersService.listMembers] Step 3 completed: Retrieved ${members?.length || 0} records (Total: ${count || 0})`
    );

    // Step 4: Map records to consistent DTO format
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
        joined_at,
        created_at,
        updated_at,
        profiles!inner (id, full_name, email, avatar_url, is_active),
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
      joinedAt: m.joined_at,
      updatedAt: m.updated_at,
    };
  }

  // Step 3: Update organization member role
  public static async updateMemberRole(
    context: AuthUserContext,
    targetUserId: string,
    dto: UpdateUserRoleDTO
  ) {
    const orgId = context.activeOrganization.id;
    Logger.info(
      `[UsersService.updateMemberRole] Step 1: Admin ${context.id} requesting role change for user ${targetUserId} to ${dto.role}`
    );

    // Rule 1: User cannot modify their own role
    if (context.id === targetUserId) {
      Logger.warn(`[UsersService.updateMemberRole] Security violation: User ${context.id} tried to modify their own role`);
      throw new Error('Users are not permitted to modify their own role.');
    }

    // Step 2: Verify target user belongs to current organization
    const { data: targetMember, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('id, user_id, role_id, roles(id, name)')
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId)
      .single();

    if (memberError || !targetMember) {
      Logger.warn(`[UsersService.updateMemberRole] Target member ${targetUserId} does not belong to org ${orgId}`);
      throw new Error('Target user does not belong to this organization.');
    }

    const currentTargetRole = (targetMember.roles as any)?.name;

    // Step 3: If demoting an ADMIN, ensure at least one other active admin remains
    if (currentTargetRole === 'ADMIN' && dto.role !== 'ADMIN') {
      Logger.info(`[UsersService.updateMemberRole] Step 3: Checking remaining active ADMIN count before demotion...`);
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
          Logger.warn(`[UsersService.updateMemberRole] Cannot demote the last remaining active Admin in org ${orgId}`);
          throw new Error('Cannot demote the only remaining active Administrator in this organization.');
        }
      }
    }

    // Step 4: Resolve new role ID
    const { data: newRole, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .eq('name', dto.role)
      .single();

    if (roleError || !newRole) {
      Logger.error(`[UsersService.updateMemberRole] Role "${dto.role}" not found in database`);
      throw new Error(`Invalid role specified: ${dto.role}`);
    }

    // Step 5: Update organization membership role
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
      Logger.error(`[UsersService.updateMemberRole] Update failed: ${updateError?.message}`);
      throw new Error('Failed to update member role');
    }

    // Step 6: Record audit log for role change
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

    Logger.info(
      `[UsersService.updateMemberRole] Step 6 completed: User ${targetUserId} role updated from ${currentTargetRole} to ${dto.role}`
    );

    return {
      membershipId: updatedMember.id,
      userId: targetUserId,
      role: dto.role,
      updatedAt: updatedMember.updated_at,
    };
  }

  // Step 4: Update member active/inactive status
  public static async updateMemberStatus(
    context: AuthUserContext,
    targetUserId: string,
    dto: UpdateUserStatusDTO
  ) {
    const orgId = context.activeOrganization.id;
    Logger.info(
      `[UsersService.updateMemberStatus] Step 1: Admin ${context.id} requesting status change for ${targetUserId} to isActive=${dto.isActive}`
    );

    // Rule 1: User cannot deactivate themselves
    if (context.id === targetUserId && !dto.isActive) {
      Logger.warn(`[UsersService.updateMemberStatus] Security violation: User ${context.id} tried to deactivate themselves`);
      throw new Error('You cannot deactivate your own account.');
    }

    // Step 2: Fetch target member details
    const { data: targetMember, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('id, user_id, role_id, is_active, roles(name)')
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId)
      .single();

    if (memberError || !targetMember) {
      Logger.warn(`[UsersService.updateMemberStatus] Member not found in org: ${targetUserId}`);
      throw new Error('Target user does not belong to this organization.');
    }

    // Step 3: Prevent deactivating the last active Admin
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
          Logger.warn(`[UsersService.updateMemberStatus] Cannot deactivate the only active Admin in org ${orgId}`);
          throw new Error('Cannot deactivate the only active Administrator in this organization.');
        }
      }
    }

    // Step 4: Update membership status
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
      Logger.error(`[UsersService.updateMemberStatus] Status update error: ${updateError?.message}`);
      throw new Error('Failed to update member status');
    }

    // Step 5: Record audit log for status change
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

    Logger.info(
      `[UsersService.updateMemberStatus] Step 5 completed: Member ${targetUserId} status updated to ${dto.isActive}`
    );

    return {
      membershipId: updatedMember.id,
      userId: targetUserId,
      isActive: updatedMember.is_active,
      updatedAt: updatedMember.updated_at,
    };
  }
}
