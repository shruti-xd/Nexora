import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

// =============================================================================
// Security Tests: Platform Administration Authorization
// Verifies boundary isolation between Platform Admins and Organization Admins
// =============================================================================

describe('Platform Administration Security Tests', () => {
  const app = createApp();

  it('Step 1: Unauthenticated request to /api/v1/platform/organizations is rejected with 401', async () => {
    console.log('[PlatformSecurityTest] Step 1: Testing /api/v1/platform/organizations unauthenticated guard');
    const res = await request(app).get('/api/v1/platform/organizations');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Step 2: Unauthenticated POST to /api/v1/platform/organizations is rejected with 401', async () => {
    console.log('[PlatformSecurityTest] Step 2: Testing POST /api/v1/platform/organizations unauthenticated guard');
    const res = await request(app)
      .post('/api/v1/platform/organizations')
      .send({
        name: 'Malicious Org',
        adminFullName: 'Hacker',
        adminEmail: 'hacker@example.com',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Step 3: Invalid token to platform endpoint is rejected with 401', async () => {
    console.log('[PlatformSecurityTest] Step 3: Testing invalid token on platform route');
    const res = await request(app)
      .get('/api/v1/platform/organizations')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED_OR_INVALID');
  });
});
