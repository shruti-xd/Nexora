import { request } from './apiClient';
import {
  Contact,
  CreateContactPayload,
  UpdateContactPayload,
  ContactQueryFilters,
  PaginationMeta,
} from '../types';

// =============================================================================
// Contacts Service
// Frontend API client for Contacts Management (Module 02)
// =============================================================================

export interface ListContactsResponse {
  contacts: Contact[];
  pagination: PaginationMeta;
}

export const contactsService = {
  // Step 1: List contacts with search, filters, and pagination
  async listContacts(filters: ContactQueryFilters = {}): Promise<ListContactsResponse> {
    console.log('[contactsService.listContacts] Step 1: Fetching contacts with filters:', filters);

    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());
    if (filters.accountId) params.append('accountId', filters.accountId);
    if (filters.ownerId) params.append('ownerId', filters.ownerId);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return request<ListContactsResponse>(`/contacts?${params.toString()}`, {
      method: 'GET',
    });
  },

  // Step 2: Get contact by ID
  async getContactById(id: string): Promise<Contact> {
    console.log(`[contactsService.getContactById] Step 2: Fetching contact details for ID: ${id}`);
    return request<Contact>(`/contacts/${id}`, {
      method: 'GET',
    });
  },

  // Step 3: Create new contact
  async createContact(payload: CreateContactPayload): Promise<Contact> {
    console.log(`[contactsService.createContact] Step 3: Creating contact "${payload.lastName}"`);
    return request<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Step 4: Update contact by ID
  async updateContact(id: string, payload: UpdateContactPayload): Promise<Contact> {
    console.log(`[contactsService.updateContact] Step 4: Updating contact ${id}`);
    return request<Contact>(`/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Step 5: Soft delete contact
  async deleteContact(id: string): Promise<{ id: string; success: boolean }> {
    console.log(`[contactsService.deleteContact] Step 5: Deleting contact ${id}`);
    return request<{ id: string; success: boolean }>(`/contacts/${id}`, {
      method: 'DELETE',
    });
  },
};
