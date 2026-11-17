import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Logger } from '../utils/logger.js';
import { AuthUserContext } from '../types/api.types.js';
import { RoleName } from '../types/db.types.js';

// =============================================================================
// Authentication Middleware
// Verifies Supabase JWT and constructs verified multi-tenant User Context
// =============================================================================

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Step 1: Extract Authorization header
    Logger.info(`[requireAuth] Authenticating request for path: ${req.path}`);
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      Logger.warn(`[requireAuth] Missing or invalid Authorization header on ${req.path}`);
      ApiResponse.error(res, 'Authentication required. Bearer token missing.', 'UNAUTHORIZED', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      Logger.warn('[requireAuth] Empty bearer token received');
      ApiResponse.error(res, 'Invalid authentication token.', 'UNAUTHORIZED', 401);
      return;
    }

    // Step 2: Validate token cryptographically with Supabase Auth
    Logger.debug('[requireAuth] Verifying token signature and claims via Supabase Auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      Logger.warn(`[requireAuth] Supabase token validation failed: ${authError?.message || 'User not found'}`);
      ApiResponse.error(
        res,
        'Invalid or expired authentication session.',
        'TOKEN_EXPIRED_OR_INVALID',
        401
      );
      return;
    }

    const authUser = authData.user;
    Logger.info(`[requireAuth] Token validated for auth user id: ${authUser.id}`);

    // Step 3: Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      Logger.error(`[requireAuth] Profile not found for auth user ${authUser.id}: ${profileError?.message}`);
      ApiResponse.error(res, 'User profile not found in CRM database.', 'PROFILE_NOT_FOUND', 404);
      return;
    }

    // Check if user account is active
    if (!profile.is_active) {
      Logger.warn(`[requireAuth] Access denied: User profile ${profile.id} is deactivated`);
      ApiResponse.error(res, 'Your user account has been deactivated. Contact your administrator.', 'ACCOUNT_DEACTIVATED', 403);
      return;
    }

    // Step 4: Resolve organization context
    // Check if an explicit organization header is provided or use first active membership
    const requestedOrgId = req.headers['x-organization-id'] as string | undefined;
    Logger.debug(`[requireAuth] Resolving organization membership (requested: ${requestedOrgId || 'default'})...`);

    let membershipQuery = supabaseAdmin
      .from('organization_members')
      .select(`
        id,
        organization_id,
        user_id,
        role_id,
        is_active,
        joined_at,
        created_at,
        updated_at,
        organizations (id, name, slug, created_at, updated_at),
        roles (id, name, description, is_system_role, created_at, updated_at)
      `)
      .eq('user_id', authUser.id)
      .eq('is_active', true);

    if (requestedOrgId) {
      membershipQuery = membershipQuery.eq('organization_id', requestedOrgId);
    }

    const { data: memberships, error: memberError } = await membershipQuery;

    if (memberError || !memberships || memberships.length === 0) {
      Logger.warn(`[requireAuth] No active organization membership found for user ${authUser.id}`);
      ApiResponse.error(
        res,
        'No active organization membership found. You must belong to an active organization.',
        'NO_ACTIVE_MEMBERSHIP',
        403
      );
      return;
    }

    const primaryMembership = memberships[0];
    const organization = primaryMembership.organizations as unknown as AuthUserContext['activeOrganization'];
    const roleRecord = primaryMembership.roles as unknown as { id: string; name: RoleName };

    if (!organization || !roleRecord) {
      Logger.error('[requireAuth] Malformed membership relations');
      ApiResponse.error(res, 'Malformed organization or role configuration.', 'INTERNAL_ERROR', 500);
      return;
    }

    // Step 5: Query role permissions
    Logger.debug(`[requireAuth] Querying permissions for role: ${roleRecord.name}`);
    const { data: rolePerms, error: permsError } = await supabaseAdmin
      .from('role_permissions')
      .select('permissions (name)')
      .eq('role_id', roleRecord.id);

    if (permsError) {
      Logger.warn(`[requireAuth] Failed to load role permissions: ${permsError.message}`);
    }

    const permissions: string[] = rolePerms
      ? rolePerms.map((rp: any) => rp.permissions?.name).filter(Boolean)
      : [];

    // Step 6: Construct and attach AuthUserContext
    req.token = token;
    req.userContext = {
      id: authUser.id,
      email: authUser.email || profile.email,
      profile,
      activeOrganization: organization,
      membership: {
        id: primaryMembership.id,
        organization_id: primaryMembership.organization_id,
        user_id: primaryMembership.user_id,
        role_id: primaryMembership.role_id,
        is_active: primaryMembership.is_active,
        joined_at: primaryMembership.joined_at,
        created_at: primaryMembership.created_at,
        updated_at: primaryMembership.updated_at,
      },
      role: roleRecord.name,
      permissions,
    };

    Logger.info(
      `[requireAuth] Request authenticated: User=${authUser.id}, Org=${organization.id} (${organization.slug}), Role=${roleRecord.name}`
    );

    next();
  } catch (err: unknown) {
    // Step 7: Peaceful error handling
    const errorMsg = err instanceof Error ? err.message : String(err);
    Logger.error(`[requireAuth] Unexpected authentication error: ${errorMsg}`);
    ApiResponse.error(res, 'Authentication verification failed.', 'AUTH_INTERNAL_ERROR', 500);
  }
};
