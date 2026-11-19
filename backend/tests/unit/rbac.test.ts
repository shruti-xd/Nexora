import { describe, it, expect, vi } from 'vitest';
import { requireRole, requirePermission, requirePlatformAdmin } from '../../src/middleware/rbac.middleware.js';
import { Request, Response } from 'express';

// =============================================================================
// Unit Tests: RBAC & Platform Admin Authorization Middleware
// Verifies Platform Admin guards, role-based access, and permission enforcement
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

  it('Step 1: Allows Platform Admin through requirePlatformAdmin guard', () => {
    console.log('[Test] Step 1: Testing Platform Admin authorization');
    const { req, res, next } = createMockReqRes({
      id: 'admin-1',
      isPlatformAdmin: true,
      permissions: ['platform:all'],
    });

    requirePlatformAdmin(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('Step 2: Denies non-platform admin with 403 on requirePlatformAdmin guard', () => {
    console.log('[Test] Step 2: Testing non-platform admin denial');
    const { req, res, next } = createMockReqRes({
      id: 'user-1',
      isPlatformAdmin: false,
      permissions: [],
    });

    requirePlatformAdmin(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('Step 3: Allows access when user role matches allowedRoles', () => {
    console.log('[Test] Step 3: Testing allowed role execution');
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

  it('Step 4: Denies access with 403 when user role is not permitted', () => {
    console.log('[Test] Step 4: Testing unauthorized role denial');
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

  it('Step 5: Grants ADMIN automatic bypass for granular organization permissions', () => {
    console.log('[Test] Step 5: Testing Admin permission bypass');
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

  it('Step 6: Allows non-admin user with exact granular permission', () => {
    console.log('[Test] Step 6: Testing non-admin granular permission match');
    const { req, res, next } = createMockReqRes({
      id: 'rep-1',
      role: 'SALES_REP',
      permissions: ['leads:create'],
    });

    const middleware = requirePermission('leads', 'create');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('Step 7: Denies non-admin user missing required permission', () => {
    console.log('[Test] Step 7: Testing missing permission rejection');
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
