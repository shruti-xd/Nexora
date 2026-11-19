import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';

// =============================================================================
// Swagger / OpenAPI Specification
// Comprehensive documentation for Salesforce-Style Access & Platform Administration
// =============================================================================

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Nexora Modern CRM Platform API',
    version: '1.0.0',
    description: 'REST API documentation for Salesforce-Style Organization-Controlled Access & Platform Administration',
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
      CreateAccountRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Acme Technologies Inc.' },
          accountType: { type: 'string', enum: ['PROSPECT', 'CUSTOMER', 'PARTNER', 'RESELLER', 'OTHER'], example: 'PROSPECT' },
          industry: { type: 'string', example: 'Software' },
          website: { type: 'string', example: 'https://acme.tech' },
          phone: { type: 'string', example: '+1-555-0100' },
          email: { type: 'string', format: 'email', example: 'sales@acme.tech' },
          annualRevenue: { type: 'number', example: 5000000 },
          employeeCount: { type: 'integer', example: 120 },
        },
      },
      CreateContactRequest: {
        type: 'object',
        required: ['lastName'],
        properties: {
          accountId: { type: 'string', format: 'uuid', nullable: true },
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Doe' },
          title: { type: 'string', example: 'VP of Sales' },
          department: { type: 'string', example: 'Executive' },
          email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
          phone: { type: 'string', example: '+1-555-0199' },
        },
      },
      CreateLeadRequest: {
        type: 'object',
        required: ['lastName', 'company'],
        properties: {
          firstName: { type: 'string', example: 'Michael' },
          lastName: { type: 'string', example: 'Scott' },
          company: { type: 'string', example: 'Dunder Mifflin Paper Co.' },
          title: { type: 'string', example: 'Regional Manager' },
          email: { type: 'string', format: 'email', example: 'm.scott@dundermifflin.com' },
          phone: { type: 'string', example: '+1-555-0122' },
          source: { type: 'string', enum: ['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'ADVERTISEMENT', 'COLD_CALL', 'EVENT', 'PARTNER', 'OTHER'], example: 'WEBSITE' },
          status: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED'], example: 'NEW' },
          rating: { type: 'string', enum: ['HOT', 'WARM', 'COLD'], example: 'HOT' },
        },
      },
      ConvertLeadRequest: {
        type: 'object',
        properties: {
          createNewAccount: { type: 'boolean', default: true },
          existingAccountId: { type: 'string', format: 'uuid', nullable: true },
          accountName: { type: 'string' },
          createNewContact: { type: 'boolean', default: true },
          existingContactId: { type: 'string', format: 'uuid', nullable: true },
          contactFirstName: { type: 'string' },
          contactLastName: { type: 'string' },
          contactEmail: { type: 'string', format: 'email' },
        },
      },
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
      CreateOrganizationRequest: {
        type: 'object',
        required: ['name', 'adminFullName', 'adminEmail'],
        properties: {
          name: { type: 'string', example: 'Acme Enterprise Solutions' },
          slug: { type: 'string', example: 'acme-enterprise' },
          adminFullName: { type: 'string', example: 'Jane Doe' },
          adminEmail: { type: 'string', format: 'email', example: 'jane.doe@acme.com' },
        },
      },
      InviteUserRequest: {
        type: 'object',
        required: ['fullName', 'email', 'role'],
        properties: {
          fullName: { type: 'string', example: 'Bob Smith' },
          email: { type: 'string', format: 'email', example: 'bob.smith@acme.com' },
          role: {
            type: 'string',
            enum: ['ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER'],
            example: 'SALES_REP',
          },
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
      UpdateOrgStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'], example: 'SUSPENDED' },
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
    '/platform/organizations': {
      post: {
        summary: 'Create organization and assign initial Organization Admin (Platform Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrganizationRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Organization created and admin provisioned' },
          '403': { description: 'Forbidden - Platform Admin privileges required' },
        },
      },
      get: {
        summary: 'List all tenant organizations (Platform Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'] } },
        ],
        responses: {
          '200': { description: 'Organizations listed' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/platform/organizations/{id}': {
      get: {
        summary: 'Get details of a specific organization (Platform Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Organization details' },
          '404': { description: 'Not found' },
        },
      },
      patch: {
        summary: 'Update organization name or slug (Platform Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Organization updated' },
        },
      },
    },
    '/platform/organizations/{id}/status': {
      patch: {
        summary: 'Activate or suspend an organization workspace (Platform Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateOrgStatusRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Organization status updated' },
        },
      },
    },
    '/platform/organizations/{id}/admin': {
      post: {
        summary: 'Assign or invite an administrator for an organization (Platform Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['adminFullName', 'adminEmail'],
                properties: {
                  adminFullName: { type: 'string' },
                  adminEmail: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Admin assigned' },
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
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/users': {
      get: {
        summary: 'List team members in active organization with pagination and filters',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'deactivated', 'pending'] } },
        ],
        responses: {
          '200': { description: 'Members retrieved' },
        },
      },
    },
    '/users/invite': {
      post: {
        summary: 'Invite new member to the organization (Org Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InviteUserRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Member invited successfully' },
          '400': { description: 'Invalid invitation payload' },
          '409': { description: 'User already active in this organization' },
        },
      },
    },
    '/users/{id}/resend-invitation': {
      post: {
        summary: 'Resend invitation email to pending member (Org Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Invitation resent' },
        },
      },
    },
    '/users/{id}/role': {
      patch: {
        summary: 'Update role of an organization member (Org Admin only)',
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
        },
      },
    },
    '/users/{id}/status': {
      patch: {
        summary: 'Activate or deactivate an organization member (Org Admin only)',
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
        },
      },
    },
    '/accounts': {
      get: {
        summary: 'List accounts with search, filter, and pagination (Scoped to active organization)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Accounts retrieved' } },
      },
      post: {
        summary: 'Create account within organization',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAccountRequest' } } },
        },
        responses: { '201': { description: 'Account created' } },
      },
    },
    '/accounts/{id}': {
      get: {
        summary: 'Get single account details by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Account details' } },
      },
      patch: {
        summary: 'Update account details',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Account updated' } },
      },
      delete: {
        summary: 'Soft-delete account (Admin or Manager only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Account soft-deleted' } },
      },
    },
    '/accounts/{id}/contacts': {
      get: {
        summary: 'List contacts associated with account',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Account contacts retrieved' } },
      },
    },
    '/contacts': {
      get: {
        summary: 'List contacts with search, account filter, and pagination',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Contacts retrieved' } },
      },
      post: {
        summary: 'Create contact within organization',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateContactRequest' } } },
        },
        responses: { '201': { description: 'Contact created' } },
      },
    },
    '/contacts/{id}': {
      get: {
        summary: 'Get contact details by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Contact details' } },
      },
      patch: {
        summary: 'Update contact details',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Contact updated' } },
      },
      delete: {
        summary: 'Soft-delete contact (Admin or Manager only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Contact deleted' } },
      },
    },
    '/leads': {
      get: {
        summary: 'List leads with search, status, rating, and conversion filters',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Leads retrieved' } },
      },
      post: {
        summary: 'Create lead within organization',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateLeadRequest' } } },
        },
        responses: { '201': { description: 'Lead created' } },
      },
    },
    '/leads/{id}': {
      get: {
        summary: 'Get lead details by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Lead details' } },
      },
      patch: {
        summary: 'Update lead details',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Lead updated' } },
      },
      delete: {
        summary: 'Soft-delete lead (Admin or Manager only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Lead deleted' } },
      },
    },
    '/leads/{id}/convert': {
      post: {
        summary: 'Convert lead into Account and Contact (Atomic PostgreSQL Transaction)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ConvertLeadRequest' } } },
        },
        responses: { '200': { description: 'Lead converted successfully' } },
      },
    },
  },
};

const swaggerRouter = Router();
swaggerRouter.use('/', swaggerUi.serve, swaggerUi.setup(openApiSpec));

export const docsRoutes = swaggerRouter;
