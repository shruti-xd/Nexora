import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { AccountsService } from '../../src/modules/accounts/accounts.service.js';
import { ContactsService } from '../../src/modules/contacts/contacts.service.js';
import { LeadsService } from '../../src/modules/leads/leads.service.js';
import { AuthUserContext } from '../../src/types/api.types.js';

// =============================================================================
// Module 02 Integration Tests: Leads, Accounts & Contacts
// Tests API endpoint guards, tenant isolation, and RBAC enforcement
// =============================================================================

describe('Module 02 CRM Integration & Security Tests', () => {
  const app = createApp();

  const mockAdminContext: AuthUserContext = {
    id: 'user-admin-123',
    email: 'admin@acme.com',
    isPlatformAdmin: false,
    profile: {
      id: 'user-admin-123',
      full_name: 'Admin User',
      email: 'admin@acme.com',
      is_active: true,
      is_platform_admin: false,
      invitation_status: 'ACCEPTED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    activeOrganization: {
      id: 'org-test-123',
      name: 'Acme Test Corp',
      slug: 'acme-test-corp',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    membership: {
      id: 'mem-123',
      organization_id: 'org-test-123',
      user_id: 'user-admin-123',
      role_id: 'role-admin-id',
      is_active: true,
      invitation_status: 'ACCEPTED',
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'ADMIN',
    permissions: [
      'leads:create',
      'leads:read',
      'leads:update',
      'leads:delete',
      'leads:convert',
      'accounts:create',
      'accounts:read',
      'accounts:update',
      'accounts:delete',
      'contacts:create',
      'contacts:read',
      'contacts:update',
      'contacts:delete',
    ],
  };

  const mockViewerContext: AuthUserContext = {
    ...mockAdminContext,
    id: 'user-viewer-456',
    email: 'viewer@acme.com',
    role: 'VIEWER',
    permissions: ['leads:read', 'accounts:read', 'contacts:read'],
  };

  // Step 1: Unauthenticated guards
  describe('Step 1: Unauthenticated Request Guards', () => {
    it('Step 1.1: GET /api/v1/leads without token returns 401 UNAUTHORIZED', async () => {
      console.log('[Test] Step 1.1: Testing unauthenticated guard on /api/v1/leads');
      const res = await request(app).get('/api/v1/leads');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Step 1.2: GET /api/v1/accounts without token returns 401 UNAUTHORIZED', async () => {
      console.log('[Test] Step 1.2: Testing unauthenticated guard on /api/v1/accounts');
      const res = await request(app).get('/api/v1/accounts');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Step 1.3: GET /api/v1/contacts without token returns 401 UNAUTHORIZED', async () => {
      console.log('[Test] Step 1.3: Testing unauthenticated guard on /api/v1/contacts');
      const res = await request(app).get('/api/v1/contacts');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // Step 2: Role-based deletion guard
  describe('Step 2: RBAC Deletion Protections', () => {
    it('Step 2.1: Denies VIEWER from deleting an account with permission error', async () => {
      console.log('[Test] Step 2.1: Testing VIEWER deletion denial on AccountsService');
      await expect(
        AccountsService.deleteAccount(mockViewerContext, 'acc-some-id')
      ).rejects.toThrow('You do not have permission to delete accounts');
    });

    it('Step 2.2: Denies VIEWER from deleting a contact with permission error', async () => {
      console.log('[Test] Step 2.2: Testing VIEWER deletion denial on ContactsService');
      await expect(
        ContactsService.deleteContact(mockViewerContext, 'cnt-some-id')
      ).rejects.toThrow('You do not have permission to delete contacts');
    });

    it('Step 2.3: Denies VIEWER from deleting a lead with permission error', async () => {
      console.log('[Test] Step 2.3: Testing VIEWER deletion denial on LeadsService');
      await expect(
        LeadsService.deleteLead(mockViewerContext, 'lead-some-id')
      ).rejects.toThrow('You do not have permission to delete leads');
    });
  });

  // Step 3: Organization context requirement
  describe('Step 3: Organization Isolation Enforcement', () => {
    it('Step 3.1: Rejects operations when activeOrganization context is missing', async () => {
      console.log('[Test] Step 3.1: Testing rejection when activeOrganization is missing');
      const noOrgContext: AuthUserContext = {
        ...mockAdminContext,
        activeOrganization: undefined,
      };

      await expect(
        AccountsService.listAccounts(noOrgContext, {})
      ).rejects.toThrow('Active organization context is required');

      await expect(
        ContactsService.listContacts(noOrgContext, {})
      ).rejects.toThrow('Active organization context is required');

      await expect(
        LeadsService.listLeads(noOrgContext, {})
      ).rejects.toThrow('Active organization context is required');
    });
  });
});
