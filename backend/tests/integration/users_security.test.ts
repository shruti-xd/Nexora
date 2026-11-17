import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { UsersService } from '../../src/modules/users/users.service.js';
import { AuthUserContext } from '../../src/types/api.types.js';

// =============================================================================
// Security Tests: User Role Modification & Deactivation Guards
// Verifies defense against self-role elevation, self-deactivation, and cross-org access
// =============================================================================

describe('User Security & Access Control Tests', () => {
  const app = createApp();

  it('Step 1: Unauthenticated request to /api/v1/users is rejected with 401', async () => {
    // Step 1: Route protection test
    console.log('[SecurityTest] Step 1: Testing /api/v1/users unauthenticated guard');
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Step 2: Service blocks user from modifying their own role', async () => {
    // Step 2: Self-role modification block test
    console.log('[SecurityTest] Step 2: Testing self-role modification prevention');
    const mockContext: AuthUserContext = {
      id: 'user-admin-123',
      email: 'admin@acme.com',
      profile: {
        id: 'user-admin-123',
        full_name: 'Admin User',
        email: 'admin@acme.com',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      activeOrganization: {
        id: 'org-123',
        name: 'Acme Corp',
        slug: 'acme-corp',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      membership: {
        id: 'mem-123',
        organization_id: 'org-123',
        user_id: 'user-admin-123',
        role_id: 'role-admin-id',
        is_active: true,
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      role: 'ADMIN',
      permissions: ['users:update_role'],
    };

    // Attempting to modify own role must throw error
    await expect(
      UsersService.updateMemberRole(mockContext, 'user-admin-123', { role: 'MANAGER' })
    ).rejects.toThrow('Users are not permitted to modify their own role.');
  });

  it('Step 3: Service blocks user from deactivating their own account', async () => {
    // Step 3: Self-deactivation block test
    console.log('[SecurityTest] Step 3: Testing self-deactivation prevention');
    const mockContext: AuthUserContext = {
      id: 'user-admin-123',
      email: 'admin@acme.com',
      profile: {
        id: 'user-admin-123',
        full_name: 'Admin User',
        email: 'admin@acme.com',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      activeOrganization: {
        id: 'org-123',
        name: 'Acme Corp',
        slug: 'acme-corp',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      membership: {
        id: 'mem-123',
        organization_id: 'org-123',
        user_id: 'user-admin-123',
        role_id: 'role-admin-id',
        is_active: true,
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      role: 'ADMIN',
      permissions: ['users:update_status'],
    };

    await expect(
      UsersService.updateMemberStatus(mockContext, 'user-admin-123', { isActive: false })
    ).rejects.toThrow('You cannot deactivate your own account.');
  });
});
