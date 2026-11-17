# Modern CRM Platform — Database Schema Documentation

## 1. Schema Overview

The database leverages PostgreSQL managed via Supabase. All primary keys use universally unique identifiers (UUIDv4) generated via `gen_random_uuid()`. Timestamps are stored using standard UTC `TIMESTAMPTZ` with automatic `updated_at` triggers.

---

## 2. Table Specifications

### 2.1. `organizations`
Stores tenant organizations and workspaces.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique organization identifier |
| `name` | VARCHAR(255) | NOT NULL | Display name of the organization |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL-safe workspace slug |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of last modification |

**Indexes**:
- `idx_organizations_slug` on `organizations(slug)`

---

### 2.2. `profiles`
Extends Supabase's internal `auth.users` table with CRM application profile details.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | Matches Supabase Auth user UUID |
| `full_name` | VARCHAR(255) | NOT NULL | User's full name |
| `email` | VARCHAR(255) | NOT NULL | User's primary email |
| `avatar_url`| VARCHAR(1024)| NULLABLE | Profile picture URL |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Global active flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of last modification |

**Indexes**:
- `idx_profiles_email` on `profiles(email)`

---

### 2.3. `roles`
Stores standard system roles and extensible custom roles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique role identifier |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | Role name (ADMIN, MANAGER, SALES_REP, VIEWER) |
| `description`| TEXT | NULLABLE | Human-readable role description |
| `is_system_role` | BOOLEAN | NOT NULL, DEFAULT true | Flag indicating protected system role |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

---

### 2.4. `permissions`
Granular authorization privileges based on resource and action.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique permission identifier |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Permission identifier (e.g., `users:update_role`) |
| `resource` | VARCHAR(50) | NOT NULL | Target entity (e.g., `users`, `organizations`) |
| `action` | VARCHAR(50) | NOT NULL | Operation (e.g., `read`, `update_role`, `create`) |
| `description` | TEXT | NULLABLE | Explanation of privilege |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes**:
- `idx_permissions_resource_action` on `permissions(resource, action)`

---

### 2.5. `role_permissions`
Many-to-many relationship mapping roles to permissions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique mapping identifier |
| `role_id` | UUID | NOT NULL, REFERENCES roles(id) ON DELETE CASCADE | Target role |
| `permission_id` | UUID | NOT NULL, REFERENCES permissions(id) ON DELETE CASCADE | Target permission |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Constraints**:
- `CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)`

---

### 2.6. `organization_members`
Associates users with organizations and their active assigned role.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique membership identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES organizations(id) ON DELETE CASCADE | Workspace reference |
| `user_id` | UUID | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | User profile reference |
| `role_id` | UUID | NOT NULL, REFERENCES roles(id) ON DELETE RESTRICT | Assigned role |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Membership status flag |
| `joined_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Membership start timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record update timestamp |

**Constraints**:
- `CONSTRAINT uq_organization_member UNIQUE (organization_id, user_id)` (prevents duplicate active memberships)

**Indexes**:
- `idx_org_members_user_id` on `organization_members(user_id)`
- `idx_org_members_org_id` on `organization_members(organization_id)`
- `idx_org_members_role_id` on `organization_members(role_id)`

---

### 2.7. `audit_logs`
Chronological record of security, role, and organization changes.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique audit record identifier |
| `organization_id` | UUID | NULLABLE, REFERENCES organizations(id) ON DELETE SET NULL | Workspace scope |
| `user_id` | UUID | NULLABLE, REFERENCES profiles(id) ON DELETE SET NULL | Actor profile |
| `action` | VARCHAR(100) | NOT NULL | Action identifier (e.g., `MEMBER_ROLE_UPDATED`) |
| `resource` | VARCHAR(100) | NOT NULL | Resource type (e.g., `organization_members`) |
| `resource_id` | VARCHAR(255) | NULLABLE | Target record ID |
| `metadata` | JSONB | NOT NULL, DEFAULT '{}'::jsonb | Contextual metadata payload |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Event timestamp |

**Indexes**:
- `idx_audit_logs_org_id` on `audit_logs(organization_id)`
- `idx_audit_logs_user_id` on `audit_logs(user_id)`
- `idx_audit_logs_created_at` on `audit_logs(created_at DESC)`

---

## 3. Stored Procedures and Triggers

### 3.1. `provision_new_organization_and_admin`
- **Security Mode**: `SECURITY DEFINER`
- **Purpose**: Atomically creates a user profile, generates an organization with a de-duplicated slug, establishes the user's membership as `ADMIN`, and records the provisioning audit log.
- **Atomicity**: Executed inside a single PostgreSQL transaction; any failure rolls back all modified rows.

### 3.2. `update_updated_at_column`
Universal trigger attached to `organizations`, `profiles`, `roles`, and `organization_members` that automatically updates `updated_at = NOW()` on `BEFORE UPDATE`.

---

## 4. Row Level Security (RLS) Policies

All tables have RLS explicitly enabled:
- `profiles`: Users can select their own profile and profiles of co-members in their organizations; users can update only their own profile.
- `organizations`: Users can view organizations where they hold an active membership. Only users with the `ADMIN` role in that organization can update organization settings.
- `roles`, `permissions`, `role_permissions`: Authenticated users have read access.
- `organization_members`: Users can view co-members of their organizations. Only organization Admins can update membership attributes (role, active status).
- `audit_logs`: Accessible strictly by Admins of the respective organization.
