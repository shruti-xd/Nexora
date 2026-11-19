import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { UsersService } from '../../src/modules/users/users.service.js';
import { AuthUserContext } from '../../src/types/api.types.js';

// =============================================================================
// Security Tests: User Role Modification, Deactivation & Invitation Guards
// Verifies defense against self-role elevation, self-deactivation, and self-invitation
// =============================================================================

describe('User Security & Access Control Tests', () => {
  const app = createApp();

  const mockActiveContext: AuthUserContext = {
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
      id: 'org-123',
      name: 'Acme Corp',
      slug: 'acme-corp',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    membership: {
      id: 'mem-123',
      organization_id: 'org-123',
      user_id: 'user-admin-123',
      role_id: 'role-admin-id',
      is_active: true,
      invitation_status: 'ACCEPTED',
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'ADMIN',
    permissions: ['users:update_role', 'users:update_status', 'users:invite'],
  };

  it('Step 1: Unauthenticated request to /api/v1/users is rejected with 401', async () => {
    console.log('[SecurityTest] Step 1: Testing /api/v1/users unauthenticated guard');
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Step 2: Service blocks user from modifying their own role', async () => {
    console.log('[SecurityTest] Step 2: Testing self-role modification prevention');
    await expect(
      UsersService.updateMemberRole(mockActiveContext, 'user-admin-123', { role: 'MANAGER' })
    ).rejects.toThrow('Users are not permitted to modify their own role.');
  });

  it('Step 3: Service blocks user from deactivating their own account', async () => {
    console.log('[SecurityTest] Step 3: Testing self-deactivation prevention');
    await expect(
      UsersService.updateMemberStatus(mockActiveContext, 'user-admin-123', { isActive: false })
    ).rejects.toThrow('You cannot deactivate your own account.');
  });

  it('Step 4: Service blocks user from inviting themselves', async () => {
    console.log('[SecurityTest] Step 4: Testing self-invitation prevention');
    await expect(
      UsersService.inviteUser(mockActiveContext, {
        fullName: 'Admin User',
        email: 'admin@acme.com',
        role: 'SALES_REP',
      })
    ).rejects.toThrow('You cannot invite yourself to your own organization.');
  });

  it('Step 5: Service blocks inviting users to a suspended organization', async () => {
    console.log('[SecurityTest] Step 5: Testing suspended org invite guard');
    const mockSuspendedContext: AuthUserContext = {
      ...mockActiveContext,
      activeOrganization: {
        ...mockActiveContext.activeOrganization!,
        status: 'SUSPENDED',
      },
    };

    await expect(
      UsersService.inviteUser(mockSuspendedContext, {
        fullName: 'New User',
        email: 'newuser@acme.com',
        role: 'SALES_REP',
      })
    ).rejects.toThrow('Cannot invite users to a suspended organization.');
  });
});
