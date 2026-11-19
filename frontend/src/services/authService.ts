import { request } from './apiClient';
import { UserProfile, Organization, Membership } from '../types';

// =============================================================================
// Auth Service
// Frontend client API calls to the backend auth module
// =============================================================================

export interface MeResponse {
  user: UserProfile;
  organization: Organization | null;
  membership: Membership | null;
  permissions: string[];
}

export const authService = {
  // Step 1: Fetch authenticated user context from backend
  async getMe(): Promise<MeResponse> {
    console.log('[authService.getMe] Step 1: Querying /auth/me for authenticated user profile and tenant context');
    return request<MeResponse>('/auth/me', {
      method: 'GET',
    });
  },

  // Step 2: Update profile details (e.g., name, avatar)
  async updateProfile(fullName?: string, avatarUrl?: string | null): Promise<UserProfile> {
    console.log('[authService.updateProfile] Step 2: Updating user profile details');
    return request<UserProfile>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ fullName, avatarUrl }),
    });
  },

  // Step 3: Audit backend logout
  async logout(): Promise<void> {
    console.log('[authService.logout] Step 3: Notifying backend of session termination');
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('[authService.logout] Step 3: Server logout audit warning (continuing local sign-out):', e);
    }
  },
};
