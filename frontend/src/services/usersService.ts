import { request } from './apiClient';
import { OrganizationMember, PaginationMeta, RoleName, InviteUserPayload } from '../types';

// =============================================================================
// Users Service
// API client for organization team member listing, role assignment, and invitations
// =============================================================================

export interface ListMembersResponse {
  members: OrganizationMember[];
  pagination: PaginationMeta;
}

export const usersService = {
  // Step 1: List organization members with search, role, status, and pagination
  async listMembers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
    status?: string
  ): Promise<ListMembersResponse> {
    console.log(
      `[usersService.listMembers] Step 1: Querying members (Page=${page}, Limit=${limit}, Search="${search || ''}", Role="${role || ''}", Status="${status || ''}")`
    );

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search && search.trim().length > 0) {
      params.append('search', search.trim());
    }
    if (role && role !== 'ALL') {
      params.append('role', role);
    }
    if (status && status !== 'ALL') {
      params.append('status', status);
    }

    return request<ListMembersResponse>(`/users?${params.toString()}`, {
      method: 'GET',
    });
  },

  // Step 2: Invite new user to the organization by email
  async inviteUser(payload: InviteUserPayload): Promise<{ membershipId: string; userId: string; email: string; role: RoleName }> {
    console.log(`[usersService.inviteUser] Step 2: Sending invitation to ${payload.email} for role ${payload.role}`);
    return request('/users/invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Step 3: Resend invitation email
  async resendInvitation(userId: string): Promise<{ success: boolean; message: string }> {
    console.log(`[usersService.resendInvitation] Step 3: Resending invitation for user ${userId}`);
    return request(`/users/${userId}/resend-invitation`, {
      method: 'POST',
    });
  },

  // Step 4: Update member role (Admin only)
  async updateRole(userId: string, role: RoleName): Promise<{ membershipId: string; userId: string; role: RoleName }> {
    console.log(`[usersService.updateRole] Step 4: Updating role for user ${userId} to "${role}"`);
    return request(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  // Step 5: Update member active/inactive status (Admin only)
  async updateStatus(userId: string, isActive: boolean): Promise<{ membershipId: string; userId: string; isActive: boolean }> {
    console.log(`[usersService.updateStatus] Step 5: Updating status for user ${userId} to isActive=${isActive}`);
    return request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },
};
