# Modern CRM Platform — Foundation & Module 01

A production-grade Customer Relationship Management (CRM) platform built on a clean **modular monolith** architecture with multi-tenant workspaces, Supabase Auth cryptographic JWT verification, granular Role-Based Access Control (RBAC), and Row-Level Security (RLS).

---

## 1. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS with custom SaaS design system
- **Routing**: React Router v6 (Protected & Public Route Guards)
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
- **Atomic Operations**: Transactional PostgreSQL stored procedures (`provision_new_organization_and_admin`)
- **SDK**: Supabase JavaScript Client (`@supabase/supabase-js`)

---

## 2. Architecture & Design Principles

```
custom_crm/
  frontend/                  # React Single-Page Application (SPA)
    src/
      components/ui/         # Reusable UI component library (Button, Modal, Input, Badge, etc.)
      contexts/              # AuthContext providing user, workspace, and role state
      features/              # Auth forms, user directory, and dashboard features
      layouts/               # AppLayout (Sidebar, Topbar) & AuthLayout
      pages/                 # Login, Register, Users, Settings, DashboardPlaceholder
      routes/                # AppRoutes, ProtectedRoute, PublicRoute
      services/              # apiClient, authService, organizationService, usersService
      types/                 # Frontend TypeScript interfaces
  backend/                   # Express.js REST API
    src/
      config/                # Environment and Supabase client configs (public & admin)
      middleware/            # requireAuth, requireRole, requirePermission, rateLimiter, etc.
      modules/
        auth/                # Registration, Profile, Logout, Validators
        organizations/       # Current Workspace inspection and settings
        users/               # Member listing, role governance, status toggles
      services/              # AuditService, SupabaseService
      utils/                 # ApiResponse, Logger, slugify
      docs/                  # Swagger OpenAPI 3.0 specification
      app.ts                 # Express app configuration
      server.ts              # HTTP server entry point
    tests/                   # Unit & Integration tests (Vitest + Supertest)
  supabase/
    migrations/              # Schema DDL, RLS policies, stored procedures, triggers
    seed.sql                 # System roles (ADMIN, MANAGER, SALES_REP, VIEWER), permissions
  docs/
    architecture.md          # Architectural deep-dive and sequence flows
    database-schema.md       # Tables, columns, constraints, foreign keys, and RLS
    api-documentation.md     # Versioned REST API specifications
  README.md
```

### Key Principles
1. **Frontend never holds privileged secrets**: `SUPABASE_SERVICE_ROLE_KEY` is exclusively stored in backend environment variables.
2. **Business API Gateway**: All domain CRM requests pass through the Node.js backend.
3. **Cryptographic Token Verification**: The backend verifies token signature, issuer, audience, and expiry via Supabase Auth.
4. **Tenant Workspace Isolation**: Every CRM record is bound to an `organization_id`. Cross-organization data leakage is blocked by backend middleware and database RLS.
5. **Atomic Workspace Provisioning**: User profile, organization creation, and Admin role assignment execute in a single atomic PostgreSQL transaction.

---

## 3. Getting Started & Installation

### Prerequisites
- **Node.js**: v20 or newer (`node -v`)
- **npm**: v10 or newer (`npm -v`)
- **Supabase Project**: Free cloud instance or local Supabase CLI/Docker

### Step 1: Clone Repository & Install Dependencies
```bash
# Clone the repository
git clone <repo-url> custom_crm
cd custom_crm

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

cd ..
```

### Step 2: Supabase Project Setup & Database Migration
1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor** tab.
3. Execute the initial migration script:
   - Copy contents of `supabase/migrations/20261117000001_initial_schema.sql` and run it in the SQL Editor.
4. Execute the seed script:
   - Copy contents of `supabase/seed.sql` and run it to populate roles and permissions.

### Step 3: Configure Environment Variables

#### Backend Configuration (`backend/.env`):
Create `backend/.env` (refer to `backend/.env.example`):
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Replace with your Supabase Project URL & Keys
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Configuration (`frontend/.env`):
Create `frontend/.env` (refer to `frontend/.env.example`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 4. Running the Application

### Start Backend API:
```bash
cd backend
npm run dev
```
- Backend starts at: `http://localhost:5000`
- API V1 Base URL: `http://localhost:5000/api/v1`
- Swagger OpenAPI Documentation: `http://localhost:5000/api/docs`

### Start Frontend Application:
In a separate terminal:
```bash
cd frontend
npm run dev
```
- Frontend application runs at: `http://localhost:5173`

---

## 5. Running Automated Tests

### Backend Unit & Integration Tests:
```bash
cd backend
npm run test
```
Verifies:
- Input validators (password strength, matching passwords, role values)
- Slugify utility and fallback behavior
- RBAC middleware (`requireRole`, `requirePermission`, admin bypass)
- Security guards (self-role modification block, self-deactivation block, route protection)
- Health check and 404 response envelopes

### Frontend Component Tests:
```bash
cd frontend
npm run test
```
Verifies:
- Accessible UI components (Button, Input, Badge)
- Loading states and disabled states

---

## 6. Implemented Module 01 Features

### Authentication & Account Management
- **Registration**: Full name, organization name, work email, password strength checks, confirmation validation.
- **Atomic Workspace Provisioning**: Calls PostgreSQL stored procedure `provision_new_organization_and_admin` to create user profile, organization slug, and Admin membership atomically.
- **Login**: Email/password authentication via Supabase Auth with session persistence across browser refreshes.
- **Password Recovery**: Forgot password request and reset password workflows.
- **Session Termination**: Server audit logging and client-side credential clearing.

### Workspace & User Role Governance
- **Role Hierarchy**: `ADMIN`, `MANAGER`, `SALES_REP`, `VIEWER`.
- **Member Directory**: Searchable, paginated list of organization members with status and role badges.
- **Admin Governance**:
  - Update team member roles with safety guards (cannot change own role, cannot demote last active admin).
  - Deactivate / reactivate members with safety guards (cannot deactivate self, cannot deactivate last active admin).
- **Audit Trails**: Security actions logged to `audit_logs` table.

---

## 7. Upcoming Scope (Module 02+)
The following CRM functional modules will be introduced in subsequent milestones:
- Module 02: Leads Management & Qualification Pipeline
- Module 03: Accounts & Contacts Hierarchies
- Module 04: Deals & Opportunities Forecasting
- Module 05: Activities, Notes & Tasks Management
