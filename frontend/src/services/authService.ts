import { request } from './apiClient';
import { RegisterFormData, UserProfile, Organization, Membership, RoleName } from '../types';

// =============================================================================
// Auth Service
// Frontend client API calls to the backend auth module
// =============================================================================

export interface MeResponse {
  user: UserProfile;
  organization: Organization;
  membership: Membership;
  permissions: string[];
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    role: RoleName;
  };
  session: {
    access_token: string;
    refresh_token: string;
  } | null;
}

export const authService = {
  // Step 1: Register new account with atomic workspace provisioning
  async register(data: RegisterFormData): Promise<RegisterResponse> {
    console.log(`[authService.register] Step 1: Submitting registration for: ${data.email}`);
    return request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Step 2: Fetch authenticated user context from backend
  async getMe(): Promise<MeResponse> {
    console.log('[authService.getMe] Step 2: Querying /auth/me for authenticated user context');
    return request<MeResponse>('/auth/me', {
      method: 'GET',
    });
  },

  // Step 3: Update profile details
  async updateProfile(fullName?: string, avatarUrl?: string | null): Promise<UserProfile> {
    console.log('[authService.updateProfile] Step 3: Updating user profile');
    return request<UserProfile>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ fullName, avatarUrl }),
    });
  },

  // Step 4: Audit backend logout
  async logout(): Promise<void> {
    console.log('[authService.logout] Step 4: Notifying backend of logout event');
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('[authService.logout] Server logout audit failed, continuing local session clear:', e);
    }
  },
};
