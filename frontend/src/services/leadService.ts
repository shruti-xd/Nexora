import { request } from './apiClient';
import { PaginationMeta } from '../types';
import {
  Lead,
  CreateLeadPayload,
  UpdateLeadPayload,
  ConvertLeadPayload,
  ConvertLeadResult,
  Activity,
  CreateActivityPayload,
} from '../types/lead.types';

// =============================================================================
// Lead Service
// API client for Lead management, activities, and conversion
// =============================================================================

export interface ListLeadsResponse {
  leads: Lead[];
  pagination: PaginationMeta;
}

export interface LeadFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  ownerId?: string;
}

export const leadService = {
  // Query leads with pagination and filters
  async listLeads(params: LeadFilterParams = {}): Promise<ListLeadsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search && params.search.trim().length > 0) query.append('search', params.search.trim());
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.ownerId) query.append('ownerId', params.ownerId);

    const qs = query.toString();
    return request<ListLeadsResponse>(`/leads${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  // Get single lead details
  async getLeadById(id: string): Promise<Lead> {
    return request<Lead>(`/leads/${id}`, {
      method: 'GET',
    });
  },

  // Create new sales lead
  async createLead(payload: CreateLeadPayload): Promise<Lead> {
    return request<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Update lead details
  async updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
    return request<Lead>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Delete lead
  async deleteLead(id: string): Promise<{ deleted: boolean; leadId: string }> {
    return request<{ deleted: boolean; leadId: string }>(`/leads/${id}`, {
      method: 'DELETE',
    });
  },

  // Convert lead to Account + Contact (+ Opportunity)
  async convertLead(id: string, payload: ConvertLeadPayload): Promise<ConvertLeadResult> {
    return request<ConvertLeadResult>(`/leads/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Fetch activities associated with a lead
  async listActivities(leadId: string): Promise<Activity[]> {
    return request<Activity[]>(`/leads/${leadId}/activities`, {
      method: 'GET',
    });
  },

  // Log activity on a lead
  async createActivity(leadId: string, payload: CreateActivityPayload): Promise<Activity> {
    return request<Activity>(`/leads/${leadId}/activities`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
