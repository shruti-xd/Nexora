import { request } from './apiClient';
import { OrganizationMember, PaginationMeta, RoleName } from '../types';

// =============================================================================
// Users Service
// API client for organization team member listing, role assignment, and status
// =============================================================================

export interface ListMembersResponse {
  members: OrganizationMember[];
  pagination: PaginationMeta;
}

export const usersService = {
  // Step 1: List organization members with search and pagination
  async listMembers(page: number = 1, limit: number = 10, search?: string): Promise<ListMembersResponse> {
    console.log(`[usersService.listMembers] Step 1: Querying members (Page=${page}, Limit=${limit}, Search="${search || ''}")`);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search && search.trim().length > 0) {
      params.append('search', search.trim());
    }

    return request<ListMembersResponse>(`/users?${params.toString()}`, {
      method: 'GET',
    });
  },

  // Step 2: Update member role (Admin only)
  async updateRole(userId: string, role: RoleName): Promise<{ membershipId: string; userId: string; role: RoleName }> {
    console.log(`[usersService.updateRole] Step 2: Updating role for user ${userId} to "${role}"`);
    return request(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  // Step 3: Update member active/inactive status (Admin only)
  async updateStatus(userId: string, isActive: boolean): Promise<{ membershipId: string; userId: string; isActive: boolean }> {
    console.log(`[usersService.updateStatus] Step 3: Updating status for user ${userId} to isActive=${isActive}`);
    return request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },
};
