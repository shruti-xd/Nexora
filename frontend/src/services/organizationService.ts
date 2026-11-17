import { request } from './apiClient';
import { Organization } from '../types';

// =============================================================================
// Organization Service
// API client for workspace settings and profile management
// =============================================================================

export const organizationService = {
  // Step 1: Query current active workspace details
  async getCurrent(): Promise<Organization> {
    console.log('[organizationService.getCurrent] Step 1: Querying current workspace');
    return request<Organization>('/organizations/current', {
      method: 'GET',
    });
  },

  // Step 2: Update workspace name/settings
  async updateCurrent(name: string): Promise<Organization> {
    console.log(`[organizationService.updateCurrent] Step 2: Updating workspace name to: "${name}"`);
    return request<Organization>('/organizations/current', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },
};
