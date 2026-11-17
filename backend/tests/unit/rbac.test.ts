import { describe, it, expect, vi } from 'vitest';
import { requireRole, requirePermission } from '../../src/middleware/rbac.middleware.js';
import { Request, Response } from 'express';

// =============================================================================
// Unit Tests: RBAC Authorization Middleware
// Verifies role-based access, permission checks, and administrator bypass logic
// =============================================================================

describe('RBAC Middleware Unit Tests', () => {
  const createMockReqRes = (userContext: any) => {
    const req = {
      userContext,
      path: '/api/v1/test',
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn();
    return { req, res, next };
  };

  it('Step 1: Allows access when user role matches allowedRoles', () => {
    // Step 1: Matching role test
    console.log('[Test] Step 1: Testing allowed role execution');
    const { req, res, next } = createMockReqRes({
      id: 'user-1',
      role: 'ADMIN',
      permissions: [],
    });

    const middleware = requireRole('ADMIN', 'MANAGER');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('Step 2: Denies access with 403 when user role is not permitted', () => {
    // Step 2: Forbidden role test
    console.log('[Test] Step 2: Testing unauthorized role denial');
    const { req, res, next } = createMockReqRes({
      id: 'user-2',
      role: 'SALES_REP',
      permissions: [],
    });

    const middleware = requireRole('ADMIN');
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('Step 3: Grants ADMIN automatic bypass for granular permissions', () => {
    // Step 3: Admin permission bypass test
    console.log('[Test] Step 3: Testing Admin permission bypass');
    const { req, res, next } = createMockReqRes({
      id: 'admin-1',
      role: 'ADMIN',
      permissions: [],
    });

    const middleware = requirePermission('leads', 'create');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('Step 4: Allows non-admin user with exact granular permission', () => {
    // Step 4: Granular permission match test
    console.log('[Test] Step 4: Testing non-admin granular permission match');
    const { req, res, next } = createMockReqRes({
      id: 'rep-1',
      role: 'SALES_REP',
      permissions: ['leads:create'],
    });

    const middleware = requirePermission('leads', 'create');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('Step 5: Denies non-admin user missing required permission', () => {
    // Step 5: Missing permission test
    console.log('[Test] Step 5: Testing missing permission rejection');
    const { req, res, next } = createMockReqRes({
      id: 'viewer-1',
      role: 'VIEWER',
      permissions: ['leads:read'],
    });

    const middleware = requirePermission('leads', 'delete');
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
