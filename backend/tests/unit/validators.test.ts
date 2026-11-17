import { describe, it, expect } from 'vitest';
import { registerSchema } from '../../src/modules/auth/auth.validators.js';
import { updateUserRoleSchema } from '../../src/modules/users/users.validators.js';

// =============================================================================
// Unit Tests: Input Validators
// Verifies Zod validation rules for registration, password policies, and roles
// =============================================================================

describe('Input Validators Unit Tests', () => {
  it('Step 1: Valid registration payload succeeds', () => {
    // Step 1: Valid registration test
    console.log('[Test] Step 1: Testing valid registration payload');
    const validData = {
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      password: 'StrongP@ssw0rd!',
      confirmPassword: 'StrongP@ssw0rd!',
      organizationName: 'Acme Health',
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('Step 2: Fails when passwords do not match', () => {
    // Step 2: Mismatched password test
    console.log('[Test] Step 2: Testing mismatched passwords rejection');
    const mismatchedData = {
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      password: 'StrongP@ssw0rd!',
      confirmPassword: 'DifferentPassword123!',
      organizationName: 'Acme Health',
    };

    const result = registerSchema.safeParse(mismatchedData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Passwords do not match');
    }
  });

  it('Step 3: Fails when password lacks special character or uppercase letter', () => {
    // Step 3: Password strength policy test
    console.log('[Test] Step 3: Testing weak password rejection');
    const weakData = {
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      password: 'weakpassword123',
      confirmPassword: 'weakpassword123',
      organizationName: 'Acme Health',
    };

    const result = registerSchema.safeParse(weakData);
    expect(result.success).toBe(false);
  });

  it('Step 4: Fails when email format is invalid', () => {
    // Step 4: Invalid email test
    console.log('[Test] Step 4: Testing invalid email rejection');
    const invalidEmailData = {
      fullName: 'Alice Smith',
      email: 'not-an-email',
      password: 'StrongP@ssw0rd!',
      confirmPassword: 'StrongP@ssw0rd!',
      organizationName: 'Acme Health',
    };

    const result = registerSchema.safeParse(invalidEmailData);
    expect(result.success).toBe(false);
  });

  it('Step 5: Enforces valid system roles in role update validator', () => {
    // Step 5: Role enum test
    console.log('[Test] Step 5: Testing valid and invalid role assignments');
    expect(updateUserRoleSchema.safeParse({ role: 'ADMIN' }).success).toBe(true);
    expect(updateUserRoleSchema.safeParse({ role: 'MANAGER' }).success).toBe(true);
    expect(updateUserRoleSchema.safeParse({ role: 'SALES_REP' }).success).toBe(true);
    expect(updateUserRoleSchema.safeParse({ role: 'VIEWER' }).success).toBe(true);
    expect(updateUserRoleSchema.safeParse({ role: 'SUPER_USER' }).success).toBe(false);
  });
});
