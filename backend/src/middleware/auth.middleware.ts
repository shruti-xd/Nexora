import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Logger } from '../utils/logger.js';
import { AuthUserContext } from '../types/api.types.js';
import { RoleName } from '../types/db.types.js';

// =============================================================================
// Authentication Middleware
// Verifies Supabase JWT, distinguishes Platform Admins, and enforces Tenant Isolation
// =============================================================================

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Step 1: Extract Authorization header
    Logger.info(`[requireAuth] Step 1: Authenticating request for path: ${req.path}`);
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
    Logger.debug('[requireAuth] Step 2: Verifying token signature and claims via Supabase Auth...');
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
    Logger.info(`[requireAuth] Step 2 completed: Token validated for auth user id: ${authUser.id}`);

    // Step 3: Fetch user profile
    Logger.debug(`[requireAuth] Step 3: Fetching user profile for ${authUser.id}...`);
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

    // Step 4: Check Platform Admin privileges
    Logger.debug(`[requireAuth] Step 4: Checking Platform Admin credentials for ${authUser.id}...`);
    const isPlatformAdmin = Boolean(profile.is_platform_admin);

    // Is this a platform administration route?
    const isPlatformRoute = req.baseUrl.includes('/platform') || req.path.startsWith('/platform');

    if (isPlatformRoute) {
      if (!isPlatformAdmin) {
        Logger.warn(`[requireAuth] Non-platform-admin ${authUser.id} attempted to access platform route ${req.path}`);
        ApiResponse.error(res, 'Access denied. Platform Administrator privileges are required.', 'FORBIDDEN_PLATFORM_ADMIN', 403);
        return;
      }

      // Attach context for platform admin without requiring tenant membership
      req.token = token;
      req.userContext = {
        id: authUser.id,
        email: authUser.email || profile.email,
        profile,
        isPlatformAdmin: true,
        permissions: ['platform:all'],
      };

      Logger.info(`[requireAuth] Platform Admin authenticated: User=${authUser.id} (${profile.email})`);
      next();
      return;
    }

    // Step 5: For CRM routes, resolve organization membership
    const requestedOrgId = req.headers['x-organization-id'] as string | undefined;
    Logger.debug(`[requireAuth] Step 5: Resolving organization membership (requested: ${requestedOrgId || 'default'})...`);

    let membershipQuery = supabaseAdmin
      .from('organization_members')
      .select(`
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
        organizations (id, name, slug, status, created_by, created_at, updated_at),
        roles (id, name, description, is_system_role, created_at, updated_at)
      `)
      .eq('user_id', authUser.id)
      .eq('is_active', true);

    if (requestedOrgId) {
      membershipQuery = membershipQuery.eq('organization_id', requestedOrgId);
    }

    const { data: memberships, error: memberError } = await membershipQuery;

    if (memberError || !memberships || memberships.length === 0) {
      // If user is a platform admin viewing regular routes, allow context without membership
      if (isPlatformAdmin) {
        req.token = token;
        req.userContext = {
          id: authUser.id,
          email: authUser.email || profile.email,
          profile,
          isPlatformAdmin: true,
          permissions: ['platform:all'],
        };
        next();
        return;
      }

      Logger.warn(`[requireAuth] No active organization membership found for user ${authUser.id}`);
      ApiResponse.error(
        res,
        'No active organization membership found. You must be invited to an active organization to access CRM functionality.',
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

    // Step 6: Enforce Organization Status check (Suspended organizations cannot access CRM)
    if (organization.status === 'SUSPENDED') {
      Logger.warn(`[requireAuth] Access denied: Organization ${organization.id} (${organization.name}) is SUSPENDED`);
      ApiResponse.error(
        res,
        'Your organization workspace has been suspended. Please contact Nexora platform support.',
        'ORGANIZATION_SUSPENDED',
        403
      );
      return;
    }

    // Step 7: Query role permissions
    Logger.debug(`[requireAuth] Step 7: Querying permissions for role: ${roleRecord.name}`);
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

    // Step 8: Construct and attach AuthUserContext
    req.token = token;
    req.userContext = {
      id: authUser.id,
      email: authUser.email || profile.email,
      profile,
      isPlatformAdmin,
      activeOrganization: organization,
      membership: {
        id: primaryMembership.id,
        organization_id: primaryMembership.organization_id,
        user_id: primaryMembership.user_id,
        role_id: primaryMembership.role_id,
        is_active: primaryMembership.is_active,
        invitation_status: primaryMembership.invitation_status,
        invited_by: primaryMembership.invited_by,
        invited_at: primaryMembership.invited_at,
        joined_at: primaryMembership.joined_at,
        created_at: primaryMembership.created_at,
        updated_at: primaryMembership.updated_at,
      },
      role: roleRecord.name,
      permissions,
    };

    Logger.info(
      `[requireAuth] Request authenticated: User=${authUser.id}, Org=${organization.id} (${organization.slug}, status=${organization.status}), Role=${roleRecord.name}, PlatformAdmin=${isPlatformAdmin}`
    );

    next();
  } catch (err: unknown) {
    // Step 9: Peaceful error handling
    const errorMsg = err instanceof Error ? err.message : String(err);
    Logger.error(`[requireAuth] Unexpected authentication error: ${errorMsg}`);
    ApiResponse.error(res, 'Authentication verification failed.', 'AUTH_INTERNAL_ERROR', 500);
  }
};
