# Nexora CRM — Enterprise SaaS Platform

A production-grade Customer Relationship Management (CRM) platform built on a clean **modular monolith** architecture featuring a **Salesforce-style organization-controlled user provisioning model**, Supabase Auth cryptographic JWT verification, two distinct administrative tiers (Platform Admin vs. Organization Admin), granular Role-Based Access Control (RBAC), and PostgreSQL Row-Level Security (RLS).

---

## 1. Core Architecture & Access Model

Nexora enforces an enterprise SaaS provisioning workflow:
1. **No Public Registration**: Self-service user signups and arbitrary workspace creation are completely disabled.
2. **Platform Administrator Tier**:
   - Internal Nexora administrators create customer organizations and assign initial Organization Administrators.
   - Platform Admins can activate or suspend tenant organizations (`ACTIVE` vs `SUSPENDED`).
   - Platform Admin privileges are provisioned strictly via a secure backend CLI bootstrap command.
3. **Organization Administrator Tier**:
   - Customer-level Admins invite team members to their workspace via email (`email`, `fullName`, `role`).
   - Admins can reassign member roles (`MANAGER`, `SALES_REP`, `VIEWER`), toggle member active states, and resend pending invitations.
4. **Unified Authentication Portal**:
   - All users authenticate through the unified Nexora login portal (`/login`).
   - A valid JWT token alone does not grant CRM access—users must have an active membership in an active tenant organization (or verified Platform Admin status).

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS with custom enterprise design system
- **Routing**: React Router v6 (Protected, Public, and Platform Route Guards)
- **Forms & Validation**: React Hook Form with Zod schema validation
- **State Management**: TanStack Query (v5) + Context API
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library + jsdom

### Backend
- **Runtime**: Node.js (v20+) with TypeScript
- **Web Framework**: Express.js
- **Validation**: Zod schema validation middleware
- **Security**: Helmet, CORS origin restriction, Express Rate Limit (Auth & API tiers)
- **API Documentation**: Swagger / OpenAPI 3.0 via `swagger-ui-express`
- **Testing**: Vitest + Supertest

### Database & Authentication
- **Database**: Supabase PostgreSQL
- **Identity & Auth**: Supabase Auth (GoTrue)
- **Data Protection**: PostgreSQL Row-Level Security (RLS) policies
- **SDK**: Supabase JavaScript Client (`@supabase/supabase-js`)

---

## 3. Directory Structure

```
custom_crm/
  frontend/                  # React Single-Page Application (SPA)
    src/
      components/ui/         # Reusable UI component library (Button, Modal, Input, Badge, Select, etc.)
      contexts/              # AuthContext (user, organization, role, isPlatformAdmin)
      features/
        auth/                # LoginForm, Password Reset
        platform/            # CreateOrganizationModal, OrganizationTable, StatusModal, AssignAdminModal
        users/               # UserList, InviteUserModal, RoleChangeModal, StatusChangeModal
      layouts/               # AppLayout (Sidebar, Topbar) & AuthLayout
      pages/                 # LoginPage, PlatformOrganizationsPage, UsersPage, SettingsPage, DashboardPlaceholder
      routes/                # AppRoutes, ProtectedRoute, PublicRoute, PlatformRoute
      services/              # apiClient, authService, platformService, usersService, organizationService
      types/                 # Frontend TypeScript interfaces
    tests/                   # Vitest frontend tests
  backend/                   # Express.js REST API
    src/
      config/                # Environment and Supabase client configs (public & admin)
      middleware/            # requireAuth, requirePlatformAdmin, requireRole, requirePermission, rateLimiter
      modules/
        auth/                # /me Profile inspection and logout audit
        platform/            # Platform Admin: Create org, list orgs, suspend/activate, assign admin
        organizations/       # Organization details and workspace settings
        users/               # Member listing, user invitations, resend invite, role & status updates
      scripts/               # Database migration runner & Platform Admin bootstrap script
      services/              # AuditService, SupabaseService
      utils/                 # ApiResponse, Logger, slugify
      docs/                  # Swagger OpenAPI 3.0 specification
      app.ts                 # Express app configuration
      server.ts              # HTTP server entry point
    tests/                   # Unit & Integration test suites (Vitest + Supertest)
  supabase/
    migrations/              # DDL migrations (tables, triggers, RLS policies, helper functions)
    seed.sql                 # System roles (ADMIN, MANAGER, SALES_REP, VIEWER), permissions
  docs/
    architecture.md          # Architectural deep-dive and sequence flows
    database-schema.md       # Tables, columns, constraints, foreign keys, and RLS
    api-documentation.md     # Versioned REST API specifications
  README.md
```

---

## 4. Getting Started & Installation

### Prerequisites
- **Node.js**: v20 or newer (`node -v`)
- **npm**: v10 or newer (`npm -v`)
- **Supabase Cloud Project**: Configured with PostgreSQL and GoTrue Auth

### Step 1: Install Dependencies
```bash
# From workspace root
npm install
```

### Step 2: Environment Configuration
Ensure `.env` exists in `backend/` and `frontend/`:

**`backend/.env`**:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**`frontend/.env`**:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Step 3: Run Database Migrations
```bash
cd backend
npm run db:migrate
```

### Step 4: Bootstrap the Initial Platform Administrator
To securely create or elevate a Platform Administrator:
```bash
# From backend directory
npm run bootstrap:admin -- <email> [fullName] [password]

# Example:
npm run bootstrap:admin -- platform.admin@nexora.com "Platform Administrator" "SecurePass123!"
```

### Step 5: Start Development Servers
```bash
# From workspace root, runs backend and frontend concurrently:
npm run dev
```
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:5000/api/docs`

---

## 5. Testing Suite

Run all unit, integration, and UI tests across the monorepo:

```bash
# Run backend tests (Vitest + Supertest)
npm run test --workspace=backend

# Run frontend tests (Vitest + Testing Library)
npm run test --workspace=frontend

# Verify production builds
npm run build
```


---

## 6. Module 02: Leads, Accounts & Contacts Management

Module 02 implements the core customer entities and relationship graph for Nexora:

1. **Leads Management**:
   - Prospective client intake with qualification status (`NEW`, `CONTACTED`, `QUALIFIED`, `UNQUALIFIED`) and commercial rating (`HOT`, `WARM`, `COLD`).
   - Server-side search, filtering, sorting, and pagination.
   - Record ownership (`owner_user_id`) with role-based data scoping (`SALES_REP` ownership restriction).
2. **Accounts Management**:
   - Business organization and partner records (`PROSPECT`, `CUSTOMER`, `PARTNER`, `RESELLER`, `OTHER`).
   - Dual address tracking (Billing Address & Shipping Address with copy helper).
   - Direct relationship navigation displaying associated contacts with count badge.
3. **Contacts Management**:
   - Individual client contact cards associated with an Account.
   - Database trigger asserting cross-organization boundary protection between contacts and accounts.
4. **Salesforce-Style Atomic Lead Conversion**:
   - Single-transaction PostgreSQL stored function `convert_lead_atomic(...)`.
   - Converts qualified leads into a new or existing Account and Contact.
   - Preserves conversion history with audit logging and prevents re-conversion.
