import { supabaseAdmin } from '../../config/supabase.js';
import { AuthUserContext, UpdateOrganizationDTO } from '../../types/api.types.js';
import { AuditService } from '../../services/audit.service.js';
import { Logger } from '../../utils/logger.js';

// =============================================================================
// Organization Service
// Manages organization workspace metadata and settings
// =============================================================================

export class OrganizationService {
  // Step 1: Retrieve details of currently active organization
  public static async getCurrent(context: AuthUserContext) {
    const orgId = context.activeOrganization.id;
    Logger.info(`[OrganizationService.getCurrent] Step 1: Querying details for org: ${orgId}`);

    // Query organization data
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgError || !organization) {
      Logger.error(`[OrganizationService.getCurrent] Error fetching organization: ${orgError?.message}`);
      throw new Error('Organization not found');
    }

    // Step 2: Query member statistics
    const { count: memberCount, error: countError } = await supabaseAdmin
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true);

    if (countError) {
      Logger.warn(`[OrganizationService.getCurrent] Warning: Could not fetch member count: ${countError.message}`);
    }

    Logger.info(`[OrganizationService.getCurrent] Org found: "${organization.name}" with ${memberCount ?? 0} active members`);

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.created_at,
      updatedAt: organization.updated_at,
      memberCount: memberCount ?? 1,
      currentUserRole: context.role,
    };
  }

  // Step 3: Update organization name/settings
  public static async updateCurrent(context: AuthUserContext, dto: UpdateOrganizationDTO) {
    const orgId = context.activeOrganization.id;
    Logger.info(`[OrganizationService.updateCurrent] Step 1: Updating organization ${orgId} to name: "${dto.name}"`);

    const { data: updatedOrg, error } = await supabaseAdmin
      .from('organizations')
      .update({
        name: dto.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select('*')
      .single();

    if (error || !updatedOrg) {
      Logger.error(`[OrganizationService.updateCurrent] Failed to update organization: ${error?.message}`);
      throw new Error(error?.message || 'Failed to update organization');
    }

    // Step 4: Record audit log for organization settings change
    await AuditService.log({
      organizationId: orgId,
      userId: context.id,
      action: 'ORGANIZATION_UPDATED',
      resource: 'organizations',
      resourceId: orgId,
      metadata: {
        previous_name: context.activeOrganization.name,
        new_name: dto.name,
      },
    });

    Logger.info(`[OrganizationService.updateCurrent] Step 4 completed: Organization ${orgId} updated successfully`);

    return {
      id: updatedOrg.id,
      name: updatedOrg.name,
      slug: updatedOrg.slug,
      updatedAt: updatedOrg.updated_at,
    };
  }
}
