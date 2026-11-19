import { supabaseAdmin } from '../../config/supabase.js';
import { UpdateProfileDTO, AuthUserContext } from '../../types/api.types.js';
import { AuditService } from '../../services/audit.service.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Auth Service
// Manages authenticated profile inspection, updates, and session termination
// (Public self-registration has been completely removed in accordance with Salesforce-style access)
// =============================================================================

export class AuthService {
  // Step 1: Fetch current authenticated user's profile and workspace context
  public static async getMe(context: AuthUserContext) {
    Logger.info(`[AuthService.getMe] Fetching user context for ID: ${context.id} (PlatformAdmin=${context.isPlatformAdmin})`);
    return {
      user: {
        id: context.id,
        email: context.email,
        fullName: context.profile.full_name,
        avatarUrl: context.profile.avatar_url,
        isActive: context.profile.is_active,
        isPlatformAdmin: context.isPlatformAdmin,
        invitationStatus: context.profile.invitation_status,
        createdAt: context.profile.created_at,
      },
      organization: context.activeOrganization
        ? {
            id: context.activeOrganization.id,
            name: context.activeOrganization.name,
            slug: context.activeOrganization.slug,
            status: context.activeOrganization.status,
            createdAt: context.activeOrganization.created_at,
          }
        : null,
      membership: context.membership
        ? {
            id: context.membership.id,
            role: context.role,
            isActive: context.membership.is_active,
            invitationStatus: context.membership.invitation_status,
            joinedAt: context.membership.joined_at,
          }
        : null,
      isPlatformAdmin: context.isPlatformAdmin,
      permissions: context.permissions,
    };
  }

  // Step 2: Update current authenticated user profile
  public static async updateMe(userId: string, dto: UpdateProfileDTO) {
    Logger.info(`[AuthService.updateMe] Updating profile for user: ${userId}`);

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.fullName !== undefined) updates.full_name = dto.fullName;
    if (dto.avatarUrl !== undefined) updates.avatar_url = dto.avatarUrl;

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();

    if (error || !updatedProfile) {
      Logger.error(`[AuthService.updateMe] Failed to update profile: ${error?.message}`);
      throw new Error(error?.message || 'Failed to update profile');
    }

    // Step 3: Record audit log for profile update
    await AuditService.log({
      userId,
      action: 'USER_PROFILE_UPDATED',
      resource: 'profiles',
      resourceId: userId,
      metadata: updates,
    });

    Logger.info(`[AuthService.updateMe] Profile updated successfully for user: ${userId}`);

    return {
      id: updatedProfile.id,
      email: updatedProfile.email,
      fullName: updatedProfile.full_name,
      avatarUrl: updatedProfile.avatar_url,
      isActive: updatedProfile.is_active,
      updatedAt: updatedProfile.updated_at,
    };
  }

  // Step 4: Logout handler (for server audit logging)
  public static async logout(context: AuthUserContext) {
    Logger.info(`[AuthService.logout] Logging logout event for user: ${context.id}`);
    await AuditService.log({
      organizationId: context.activeOrganization?.id || null,
      userId: context.id,
      action: 'USER_LOGOUT',
      resource: 'auth',
      resourceId: context.id,
    });
    return { success: true };
  }
}
