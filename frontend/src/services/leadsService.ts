import { request } from './apiClient';
import {
  Lead,
  CreateLeadPayload,
  UpdateLeadPayload,
  LeadQueryFilters,
  PaginationMeta,
  ConvertLeadPayload,
  ConvertLeadResult,
} from '../types';

// =============================================================================
// Leads Service
// Frontend API client for Leads Management & Conversion (Module 02)
// =============================================================================

export interface ListLeadsResponse {
  leads: Lead[];
  pagination: PaginationMeta;
}

export const leadsService = {
  // Step 1: List leads with search, filters, and pagination
  async listLeads(filters: LeadQueryFilters = {}): Promise<ListLeadsResponse> {
    console.log('[leadsService.listLeads] Step 1: Fetching leads with filters:', filters);

    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());
    if (filters.status && filters.status !== ('ALL' as any)) params.append('status', filters.status);
    if (filters.source && filters.source !== ('ALL' as any)) params.append('source', filters.source);
    if (filters.rating && filters.rating !== ('ALL' as any)) params.append('rating', filters.rating);
    if (filters.isConverted !== undefined) params.append('isConverted', filters.isConverted.toString());
    if (filters.ownerId) params.append('ownerId', filters.ownerId);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return request<ListLeadsResponse>(`/leads?${params.toString()}`, {
      method: 'GET',
    });
  },

  // Step 2: Get lead by ID
  async getLeadById(id: string): Promise<Lead> {
    console.log(`[leadsService.getLeadById] Step 2: Fetching lead details for ID: ${id}`);
    return request<Lead>(`/leads/${id}`, {
      method: 'GET',
    });
  },

  // Step 3: Create new lead
  async createLead(payload: CreateLeadPayload): Promise<Lead> {
    console.log(`[leadsService.createLead] Step 3: Creating lead "${payload.company}"`);
    return request<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Step 4: Update lead by ID
  async updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
    console.log(`[leadsService.updateLead] Step 4: Updating lead ${id}`);
    return request<Lead>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Step 5: Soft delete lead
  async deleteLead(id: string): Promise<{ id: string; success: boolean }> {
    console.log(`[leadsService.deleteLead] Step 5: Deleting lead ${id}`);
    return request<{ id: string; success: boolean }>(`/leads/${id}`, {
      method: 'DELETE',
    });
  },

  // Step 6: Convert Lead into Account and Contact
  async convertLead(id: string, payload: ConvertLeadPayload): Promise<ConvertLeadResult> {
    console.log(`[leadsService.convertLead] Step 6: Converting lead ${id}`);
    return request<ConvertLeadResult>(`/leads/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
