import { describe, it, expect } from 'vitest';
import { createOrganizationSchema } from '../../src/modules/platform/platform.validators.js';
import { inviteUserSchema, updateUserRoleSchema } from '../../src/modules/users/users.validators.js';

// =============================================================================
// Unit Tests: Input Validators
// Verifies Zod validation rules for platform organization creation, invites, and roles
// =============================================================================

describe('Input Validators Unit Tests', () => {
  it('Step 1: Valid platform organization creation payload succeeds', () => {
    console.log('[Test] Step 1: Testing valid platform organization creation payload');
    const validData = {
      name: 'Acme Enterprise',
      slug: 'acme-enterprise',
      adminFullName: 'Jane Doe',
      adminEmail: 'jane.doe@acme.com',
    };

    const result = createOrganizationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('Step 2: Fails when organization admin email is invalid', () => {
    console.log('[Test] Step 2: Testing invalid admin email rejection');
    const invalidData = {
      name: 'Acme Enterprise',
      adminFullName: 'Jane Doe',
      adminEmail: 'invalid-email',
    };

    const result = createOrganizationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('Step 3: Valid user invitation payload succeeds', () => {
    console.log('[Test] Step 3: Testing user invitation payload');
    const validInvite = {
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      role: 'SALES_REP',
    };

    const result = inviteUserSchema.safeParse(validInvite);
    expect(result.success).toBe(true);
  });

  it('Step 4: Fails when invitation has invalid role', () => {
    console.log('[Test] Step 4: Testing invitation invalid role rejection');
    const invalidInvite = {
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      role: 'SUPER_ADMIN',
    };

    const result = inviteUserSchema.safeParse(invalidInvite);
    expect(result.success).toBe(false);
  });

  it('Step 5: Enforces valid system roles in role update validator', () => {
    console.log('[Test] Step 5: Testing valid and invalid role assignments');
    expect(updateUserRoleSchema.safeParse({ role: 'ADMIN' }).success).toBe(true);
    expect(updateUserRoleSchema.safeParse({ role: 'MANAGER' }).success).toBe(true);
    expect(updateUserRoleSchema.safeParse({ role: 'SALES_REP' }).success).toBe(true);
    expect(updateUserRoleSchema.safeParse({ role: 'VIEWER' }).success).toBe(true);
    expect(updateUserRoleSchema.safeParse({ role: 'SUPER_USER' }).success).toBe(false);
  });
});
