import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

// =============================================================================
// Integration Tests: Authentication & System Endpoints
// Verifies HTTP responses, security headers, token gating, and payload validation
// =============================================================================

describe('Authentication & System Integration Tests', () => {
  const app = createApp();

  it('Step 1: Health check endpoint returns 200 and UP status', async () => {
    // Step 1: Health check request
    console.log('[IntegrationTest] Step 1: Invoking /api/v1/health');
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.version).toBe('1.0.0');
  });

  it('Step 2: Reject registration with 400 when required fields are missing', async () => {
    // Step 2: Invalid registration test
    console.log('[IntegrationTest] Step 2: Testing registration rejection for missing fields');
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'incomplete@example.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('Step 3: Reject protected /api/v1/auth/me with 401 when Authorization header is missing', async () => {
    // Step 3: Missing authorization header test
    console.log('[IntegrationTest] Step 3: Testing 401 rejection for unauthenticated request');
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Step 4: Reject protected /api/v1/auth/me with 401 when invalid Bearer token is provided', async () => {
    // Step 4: Invalid token test
    console.log('[IntegrationTest] Step 4: Testing 401 rejection for invalid/expired token');
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-dummy-token-abc-123');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED_OR_INVALID');
  });

  it('Step 5: Return 404 with standardized error envelope for non-existent routes', async () => {
    // Step 5: Route not found test
    console.log('[IntegrationTest] Step 5: Testing 404 handler');
    const res = await request(app).get('/api/v1/non-existent-endpoint');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
