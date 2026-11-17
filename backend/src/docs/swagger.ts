import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';

// =============================================================================
// Swagger / OpenAPI Specification
// Comprehensive documentation for Module 01 endpoints
// =============================================================================

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Modern CRM Platform API',
    version: '1.0.0',
    description: 'REST API documentation for Foundation & Module 01: Authentication, Organizations & RBAC',
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide Supabase Access Token',
      },
      OrganizationHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'x-organization-id',
        description: 'Optional organization context override UUID',
      },
    },
    schemas: {
      ApiResponseSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
      },
      ApiResponseError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'A meaningful error message' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'ERROR_CODE' },
              details: { nullable: true, example: null },
            },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password', 'confirmPassword', 'organizationName'],
        properties: {
          fullName: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
          password: { type: 'string', format: 'password', example: 'P@ssword123!' },
          confirmPassword: { type: 'string', format: 'password', example: 'P@ssword123!' },
          organizationName: { type: 'string', example: 'Acme Technologies' },
        },
      },
      UpdateUserRoleRequest: {
        type: 'object',
        required: ['role'],
        properties: {
          role: {
            type: 'string',
            enum: ['ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER'],
            example: 'MANAGER',
          },
        },
      },
      UpdateUserStatusRequest: {
        type: 'object',
        required: ['isActive'],
        properties: {
          isActive: { type: 'boolean', example: false },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Service health check',
        responses: {
          '200': { description: 'API service is operational' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register new user and provision organization with Admin role',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'User and workspace provisioned successfully' },
          '400': { description: 'Validation failure' },
          '409': { description: 'Email already exists' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Retrieve currently authenticated user and active workspace profile',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Profile retrieved' },
          '401': { description: 'Unauthorized' },
        },
      },
      patch: {
        summary: 'Update current user profile information',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string', example: 'Jane Doe' },
                  avatarUrl: { type: 'string', example: 'https://images.unsplash.com/photo-1' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Record application logout event and clear server-side state',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out successfully' },
        },
      },
    },
    '/organizations/current': {
      get: {
        summary: 'Get details of current active organization workspace',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Organization workspace details' },
        },
      },
      patch: {
        summary: 'Update organization name and configuration (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Acme Enterprise Solutions' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Organization updated' },
          '403': { description: 'Forbidden - Requires org:update permission' },
        },
      },
    },
    '/users': {
      get: {
        summary: 'List team members in active organization with pagination and search',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Members retrieved' },
        },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Get details of a specific organization member',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Member retrieved' },
          '404': { description: 'Member not found' },
        },
      },
    },
    '/users/{id}/role': {
      patch: {
        summary: 'Update role of an organization member (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRoleRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Member role updated' },
          '400': { description: 'Invalid role or self-role modification attempt' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/users/{id}/status': {
      patch: {
        summary: 'Activate or deactivate an organization member (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserStatusRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Member status updated' },
          '400': { description: 'Self-deactivation or last-admin deactivation attempt' },
          '403': { description: 'Forbidden' },
        },
      },
    },
  },
};

const swaggerRouter = Router();
swaggerRouter.use('/', swaggerUi.serve, swaggerUi.setup(openApiSpec));

export const docsRoutes = swaggerRouter;
