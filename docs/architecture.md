# Nexora CRM — Architecture Documentation

## 1. System Overview

Nexora is engineered as an enterprise-grade SaaS Customer Relationship Management (CRM) platform following a **Salesforce-style organization-controlled access model**.

Key architectural pillars for Foundation and Module 01 include:
- **Strict Organization-Controlled Provisioning**: Self-service public user registration and arbitrary organization creation are completely decommissioned.
- **Two Distinct Administrative Tiers**:
  1. **Platform Administrator**: Internal Nexora administrator who provisions customer organizations, manages tenant lifecycle states (`ACTIVE` vs `SUSPENDED`), and assigns initial Organization Admins.
  2. **Organization Administrator**: Customer-level administrator who manages team members, invites users via email, assigns granular organizational roles, and governs member access states.
- **Unified Authentication Gateway**: All users (Platform Admins, Org Admins, and Organization Members) authenticate through a single, unified Nexora login portal powered by Supabase GoTrue Auth.
- **Active Membership Enforcement**: A valid Supabase JWT token alone does not grant CRM access. Users must have an active membership in an active organization (or verified Platform Admin status) to access application APIs.
- **Multi-Tenant Isolation**: Tenant data is isolated cryptographically and logically at the application middleware and PostgreSQL Row-Level Security (RLS) layers.
- **Modular Monolith**: High cohesion, zero microservice bloat, no external message queue dependencies (no Redis, Kafka, or BullMQ required for core functionality).

---

## 2. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Frontend (React + Vite + Tailwind CSS + TypeScript)"]
        LoginPage["Unified Login Page (Supabase Auth)"]
        CRMWorkspace["CRM Workspace UI (Dashboard, Members, Settings)"]
        PlatformConsole["Platform Admin Console (/platform/organizations)"]
        AuthCtx["Auth Context (Session, Profile, Permissions)"]
        ApiClient["HTTP API Client (Bearer JWT + x-organization-id)"]
    end

    subgraph Backend["Backend (Node.js + Express + TypeScript)"]
        SecurityGateway["Security Gateway (Helmet, CORS, RateLimiter)"]
        AuthMid["Auth Middleware (requireAuth + Org Status Check)"]
        RBACMid["RBAC Guards (requirePlatformAdmin, requireRole, requirePermission)"]
        
        subgraph Modules["Domain Service Modules"]
            PlatformMod["Platform Module (Org Provisioning, Tenant Suspension, Admin Assignment)"]
            UserMod["Users & Team Module (Invitations, Roles, Member Status)"]
            OrgMod["Organizations Module (Metadata, Context)"]
            AuthMeMod["Auth Module (/me Profile & Permissions)"]
        end

        AuditSvc["Audit Logging Service"]
    end

    subgraph Supabase["Supabase Cloud / PostgreSQL"]
        SupaAuth["Supabase Auth (auth.users)"]
        AdminAPI["Supabase Auth Admin SDK (Service Role)"]
        PlatformAdminsTable[("platform_admins")]
        OrgTable[("organizations (status: ACTIVE | SUSPENDED)")]
        ProfilesTable[("profiles (is_platform_admin, invitation_status)")]
        MembersTable[("organization_members (invitation_status, invited_by)")]
        RolesPerms[("roles & permissions")]
        AuditTable[("audit_logs")]
        RLS["PostgreSQL Row Level Security (RLS)"]
    end

    LoginPage -->|signInWithPassword| SupaAuth
    CRMWorkspace --> ApiClient
    PlatformConsole --> ApiClient
    ApiClient -->|REST Bearer Token| SecurityGateway
    SecurityGateway --> AuthMid
    AuthMid -->|Verify JWT| SupaAuth
    AuthMid --> RBACMid
    RBACMid --> Modules
    PlatformMod --> AdminAPI
    PlatformMod --> OrgTable
    UserMod --> AdminAPI
    UserMod --> MembersTable
    Modules --> AuditSvc
    AuditSvc --> AuditTable
    OrgTable --> RLS
    MembersTable --> RLS
```

---

## 3. Administrative Tiers & Role Specification

### A. Platform Administrator (Internal Nexora Admin)
- **Scope**: Platform-wide.
- **Responsibilities**:
  - Provision new customer tenant organizations.
  - Update organization names and vanity URL slugs.
  - Activate or suspend tenant organizations (`status: ACTIVE | SUSPENDED`). When suspended, all members of that tenant are blocked from CRM APIs.
  - Assign or reassign the primary Organization Administrator.
  - Manage platform configurations.
- **Security & Bootstrap**:
  - Maintained in a dedicated `platform_admins` database table.
  - Privileges can **never** be obtained via public endpoints or organization role assignments.
  - Initial platform administrator is provisioned exclusively via secure CLI bootstrap: `npm run bootstrap:admin -- <email> [fullName] [password]`.

### B. Organization Administrator (Tenant Admin)
- **Scope**: Specific customer organization only.
- **Responsibilities**:
  - Invite new team members by email (`email`, `fullName`, `role`).
  - Resend pending email invitations.
  - Promote or change user roles (`MANAGER`, `SALES_REP`, `VIEWER`).
  - Activate / Deactivate members within their organization.
- **Prohibitions**:
  - Cannot access other tenant organizations.
  - Cannot assign Platform Admin rights.
  - Cannot modify their own role or deactivate the organization's sole active Admin.

### C. Organization Members
- **MANAGER**: Team supervisor with elevated visibility into assigned records.
- **SALES_REP**: Operational CRM user managing assigned leads, accounts, contacts, and deals.
- **VIEWER**: Read-only auditor or stakeholder.

---

## 4. Multi-Tenant Relational Schema

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : contains
    PROFILES ||--o{ ORGANIZATION_MEMBERS : has
    ROLES ||--o{ ORGANIZATION_MEMBERS : assigned_to
    ROLES ||--o{ ROLE_PERMISSIONS : defines
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : granted_via
    PROFILES ||--o| PLATFORM_ADMINS : elevated_to
    ORGANIZATIONS ||--o{ AUDIT_LOGS : records
    PROFILES ||--o{ AUDIT_LOGS : triggers

    ORGANIZATIONS {
        uuid id PK
        string name
        string slug UK
        string status "ACTIVE | SUSPENDED"
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }

    PLATFORM_ADMINS {
        uuid user_id PK,FK
        timestamp created_at
    }

    PROFILES {
        uuid id PK
        string full_name
        string email UK
        string avatar_url
        boolean is_active
        boolean is_platform_admin
        string invitation_status "PENDING | ACCEPTED | ACTIVE"
        timestamp created_at
        timestamp updated_at
    }

    ORGANIZATION_MEMBERS {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        uuid role_id FK
        boolean is_active
        string invitation_status "PENDING | ACCEPTED"
        uuid invited_by FK
        timestamp invited_at
        timestamp joined_at
    }

    ROLES {
        uuid id PK
        string name UK
        string description
        boolean is_system_role
    }

    PERMISSIONS {
        uuid id PK
        string name UK
        string resource
        string action
    }

    AUDIT_LOGS {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string action
        string resource
        string resource_id
        jsonb metadata
        timestamp created_at
    }
```

---

## 5. Security & Request Lifecycle

1. **Authentication Verification**:
   - `requireAuth` validates the Supabase JWT using `supabaseAdmin.auth.getUser(token)`.
   - Checks if user exists and is active in `profiles`.
   - Checks if user is recorded in `platform_admins`.
   - Resolves organization membership from `organization_members`.
   - **Suspension Gate**: If the user's organization is `SUSPENDED`, requests are immediately rejected with `403 FORBIDDEN_ORGANIZATION_SUSPENDED`.
   - Populates typed `req.user` context.
2. **Platform Admin Gate (`requirePlatformAdmin`)**:
   - Asserts `req.user.isPlatformAdmin === true`. Rejects with `403 FORBIDDEN_PLATFORM_ADMIN` otherwise.
3. **Role & Permission Guards (`requireRole`, `requirePermission`)**:
   - Asserts that the authenticated member possesses the necessary role or granular permission within the organization.
4. **Audit Trail**:
   - Administrative mutations (organization provisioning, status changes, invitations, role changes) log an immutable entry in `audit_logs`.
5. **Standardized JSON Envelope**:
   - Success: `{ "success": true, "message": "...", "data": {...} }`
   - Error: `{ "success": false, "message": "...", "error": { "code": "...", "details": ... } }`
