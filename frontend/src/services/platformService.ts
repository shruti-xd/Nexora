import { request } from './apiClient';
import {
  PlatformOrganization,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
  OrganizationStatus,
  AssignAdminPayload,
  PaginationMeta,
} from '../types';

// =============================================================================
// Platform Administration Service
// API client for platform-wide organization provisioning, status, and administration
// =============================================================================

export interface ListPlatformOrgsResponse {
  organizations: PlatformOrganization[];
  pagination: PaginationMeta;
}

export const platformService = {
  // Step 1: List organizations across the platform with search and status filtering
  async listOrganizations(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
  ): Promise<ListPlatformOrgsResponse> {
    console.log(
      `[platformService.listOrganizations] Step 1: Fetching platform organizations (Page=${page}, Limit=${limit}, Search="${search || ''}", Status="${status || ''}")`
    );

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search && search.trim().length > 0) {
      params.append('search', search.trim());
    }
    if (status && status !== 'ALL') {
      params.append('status', status.toUpperCase());
    }

    return request<ListPlatformOrgsResponse>(`/platform/organizations?${params.toString()}`, {
      method: 'GET',
    });
  },

  // Step 2: Retrieve single organization details
  async getOrganization(id: string): Promise<PlatformOrganization> {
    console.log(`[platformService.getOrganization] Step 2: Fetching organization details for ID: ${id}`);
    return request<PlatformOrganization>(`/platform/organizations/${id}`, {
      method: 'GET',
    });
  },

  // Step 3: Create a new organization and assign initial Organization Admin
  async createOrganization(payload: CreateOrganizationPayload): Promise<PlatformOrganization> {
    console.log(`[platformService.createOrganization] Step 3: Creating organization "${payload.name}" with admin ${payload.adminEmail}`);
    return request<PlatformOrganization>('/platform/organizations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Step 4: Update organization metadata
  async updateOrganization(id: string, payload: UpdateOrganizationPayload): Promise<PlatformOrganization> {
    console.log(`[platformService.updateOrganization] Step 4: Updating organization ${id} (Name: "${payload.name}", Slug: "${payload.slug}")`);
    return request<PlatformOrganization>(`/platform/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Step 5: Update organization active / suspended status
  async updateOrganizationStatus(id: string, status: OrganizationStatus): Promise<{ id: string; status: OrganizationStatus }> {
    console.log(`[platformService.updateOrganizationStatus] Step 5: Updating organization ${id} status to "${status}"`);
    return request<{ id: string; status: OrganizationStatus }>(`/platform/organizations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Step 6: Assign or invite initial Organization Admin
  async assignAdmin(id: string, payload: AssignAdminPayload): Promise<unknown> {
    console.log(`[platformService.assignAdmin] Step 6: Assigning admin ${payload.adminEmail} to organization ${id}`);
    return request(`/platform/organizations/${id}/admin`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
