import { request } from './apiClient';
import {
  Account,
  CreateAccountPayload,
  UpdateAccountPayload,
  AccountQueryFilters,
  PaginationMeta,
  Contact,
} from '../types';

// =============================================================================
// Accounts Service
// Frontend API client for Accounts Management (Module 02)
// =============================================================================

export interface ListAccountsResponse {
  accounts: Account[];
  pagination: PaginationMeta;
}

export const accountsService = {
  // Step 1: List accounts with search, filters, and pagination
  async listAccounts(filters: AccountQueryFilters = {}): Promise<ListAccountsResponse> {
    console.log('[accountsService.listAccounts] Step 1: Fetching accounts with filters:', filters);

    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());
    if (filters.accountType && filters.accountType !== ('ALL' as any)) params.append('accountType', filters.accountType);
    if (filters.industry && filters.industry.trim()) params.append('industry', filters.industry.trim());
    if (filters.ownerId) params.append('ownerId', filters.ownerId);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return request<ListAccountsResponse>(`/accounts?${params.toString()}`, {
      method: 'GET',
    });
  },

  // Step 2: Get account by ID
  async getAccountById(id: string): Promise<Account> {
    console.log(`[accountsService.getAccountById] Step 2: Fetching account details for ID: ${id}`);
    return request<Account>(`/accounts/${id}`, {
      method: 'GET',
    });
  },

  // Step 3: Create new account
  async createAccount(payload: CreateAccountPayload): Promise<Account> {
    console.log(`[accountsService.createAccount] Step 3: Creating account "${payload.name}"`);
    return request<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Step 4: Update account by ID
  async updateAccount(id: string, payload: UpdateAccountPayload): Promise<Account> {
    console.log(`[accountsService.updateAccount] Step 4: Updating account ${id}`);
    return request<Account>(`/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Step 5: Soft delete account
  async deleteAccount(id: string): Promise<{ id: string; success: boolean }> {
    console.log(`[accountsService.deleteAccount] Step 5: Deleting account ${id}`);
    return request<{ id: string; success: boolean }>(`/accounts/${id}`, {
      method: 'DELETE',
    });
  },

  // Step 6: Get associated contacts for account
  async getAccountContacts(id: string): Promise<Contact[]> {
    console.log(`[accountsService.getAccountContacts] Step 6: Fetching contacts for account ${id}`);
    return request<Contact[]>(`/accounts/${id}/contacts`, {
      method: 'GET',
    });
  },
};
