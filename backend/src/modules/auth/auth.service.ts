import { supabaseAdmin, supabasePublic } from '../../config/supabase.js';
import { RegisterDTO, UpdateProfileDTO, AuthUserContext } from '../../types/api.types.js';
import { AuditService } from '../../services/audit.service.js';
import { slugify } from '../../utils/slugify.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Auth Service
// Manages registration, organization provisioning, user profile, and session termination
// =============================================================================

export class AuthService {
  // Step 1: Register new user, create workspace, and provision admin role transactionally
  public static async register(dto: RegisterDTO) {
    Logger.info(`[AuthService.register] Step 1: Starting registration for email: ${dto.email}`);

    // Step 2: Duplicate check in profiles table
    Logger.info(`[AuthService.register] Step 2: Checking for duplicate email in database...`);
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', dto.email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      Logger.warn(`[AuthService.register] Duplicate email detected: ${dto.email}`);
      throw new Error('An account with this email address already exists.');
    }

    // Step 3: Create Supabase Auth user via admin API
    Logger.info(`[AuthService.register] Step 3: Creating Supabase Auth record...`);
    const { data: authCreated, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: dto.email.toLowerCase(),
      password: dto.password,
      email_confirm: true, // Auto-confirm email for frictionless CRM onboarding
      user_metadata: {
        full_name: dto.fullName,
        organization_name: dto.organizationName,
      },
    });

    if (authError || !authCreated.user) {
      Logger.error(`[AuthService.register] Supabase Auth creation failed: ${authError?.message}`);
      throw new Error(authError?.message || 'Failed to create user authentication account');
    }

    const userId = authCreated.user.id;
    Logger.info(`[AuthService.register] Step 3 completed: Supabase Auth user created with ID: ${userId}`);

    // Step 4: Provision organization, profile, and admin membership transactionally via RPC
    const initialSlug = slugify(dto.organizationName);
    Logger.info(`[AuthService.register] Step 4: Executing atomic database provisioning RPC with slug: ${initialSlug}...`);

    const { data: provisionResult, error: provisionError } = await supabaseAdmin.rpc(
      'provision_new_organization_and_admin',
      {
        p_user_id: userId,
        p_org_name: dto.organizationName,
        p_org_slug: initialSlug,
        p_full_name: dto.fullName,
        p_email: dto.email.toLowerCase(),
      }
    );

    if (provisionError) {
      // Rollback: delete auth user if provisioning fails
      Logger.error(`[AuthService.register] Provisioning failed: ${provisionError.message}. Rolling back auth user...`);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Database provisioning error: ${provisionError.message}`);
    }

    Logger.info(`[AuthService.register] Step 4 completed: Provisioning succeeded:`, provisionResult);

    // Step 5: Establish initial session by authenticating with Supabase
    Logger.info(`[AuthService.register] Step 5: Generating session tokens...`);
    const { data: sessionData, error: sessionError } = await supabasePublic.auth.signInWithPassword({
      email: dto.email.toLowerCase(),
      password: dto.password,
    });

    if (sessionError) {
      Logger.warn(`[AuthService.register] Auto-login session failed: ${sessionError.message}`);
    }

    // Step 6: Log audit trail for user registration
    await AuditService.log({
      organizationId: provisionResult?.organization_id,
      userId,
      action: 'USER_REGISTERED',
      resource: 'users',
      resourceId: userId,
      metadata: {
        email: dto.email,
        organization_name: dto.organizationName,
      },
    });

    Logger.info(`[AuthService.register] Step 6 completed: Registration complete for ${dto.email}`);

    return {
      user: {
        id: userId,
        email: dto.email.toLowerCase(),
        fullName: dto.fullName,
      },
      organization: {
        id: provisionResult?.organization_id,
        name: dto.organizationName,
        slug: provisionResult?.organization_slug,
        role: 'ADMIN',
      },
      session: sessionData?.session ?? null,
    };
  }

  // Step 2: Fetch current authenticated user's profile and workspace context
  public static async getMe(context: AuthUserContext) {
    Logger.info(`[AuthService.getMe] Fetching user context for ID: ${context.id}`);
    return {
      user: {
        id: context.id,
        email: context.email,
        fullName: context.profile.full_name,
        avatarUrl: context.profile.avatar_url,
        isActive: context.profile.is_active,
        createdAt: context.profile.created_at,
      },
      organization: {
        id: context.activeOrganization.id,
        name: context.activeOrganization.name,
        slug: context.activeOrganization.slug,
        createdAt: context.activeOrganization.created_at,
      },
      membership: {
        id: context.membership.id,
        role: context.role,
        isActive: context.membership.is_active,
        joinedAt: context.membership.joined_at,
      },
      permissions: context.permissions,
    };
  }

  // Step 3: Update current authenticated user profile
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

    // Step 4: Record audit log for profile update
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
      organizationId: context.activeOrganization.id,
      userId: context.id,
      action: 'USER_LOGOUT',
      resource: 'auth',
      resourceId: context.id,
    });
    return { success: true };
  }
}
