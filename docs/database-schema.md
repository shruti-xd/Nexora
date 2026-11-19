# Nexora CRM — Database Schema Documentation

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
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Lifecycle state: `ACTIVE` or `SUSPENDED` |
| `created_by` | UUID | NULLABLE, REFERENCES auth.users(id) | Platform admin who created the org |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of last modification |

**Indexes & Constraints**:
- `idx_organizations_slug` on `organizations(slug)`
- `idx_organizations_status` on `organizations(status)`
- Check constraint: `status IN ('ACTIVE', 'SUSPENDED')`

---

### 2.2. `platform_admins`
Dedicated registry identifying internal Nexora Platform Administrators.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | Platform administrator user ID |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of privilege grant |

---

### 2.3. `profiles`
Extends Supabase's internal `auth.users` table with CRM application profile details.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | Matches Supabase Auth user UUID |
| `full_name` | VARCHAR(255) | NOT NULL | User's full name |
| `email` | VARCHAR(255) | NOT NULL | User's primary email |
| `avatar_url`| VARCHAR(1024)| NULLABLE | Profile picture URL |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Global active flag |
| `is_platform_admin` | BOOLEAN | NOT NULL, DEFAULT false | Quick flag synced with `platform_admins` |
| `invitation_status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Onboarding status: `PENDING`, `ACCEPTED`, `ACTIVE` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of last modification |

**Indexes**:
- `idx_profiles_email` on `profiles(email)`
- `idx_profiles_platform_admin` on `profiles(is_platform_admin)`

---

### 2.4. `roles`
Stores standard system roles and extensible custom roles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique role identifier |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | Role name (`ADMIN`, `MANAGER`, `SALES_REP`, `VIEWER`) |
| `description`| TEXT | NULLABLE | Human-readable role description |
| `is_system_role` | BOOLEAN | NOT NULL, DEFAULT true | Flag indicating protected system role |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

---

### 2.5. `permissions`
Granular authorization privileges based on resource and action.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique permission identifier |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Permission identifier (e.g., `users:invite`, `platform:manage_organizations`) |
| `resource` | VARCHAR(50) | NOT NULL | Target entity (`platform`, `users`, `organizations`, etc.) |
| `action` | VARCHAR(50) | NOT NULL | Operation (`manage_organizations`, `invite`, `read`, etc.) |
| `description` | TEXT | NULLABLE | Explanation of privilege |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

---

### 2.6. `role_permissions`
Many-to-many relationship mapping roles to permissions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `role_id` | UUID | NOT NULL, REFERENCES roles(id) ON DELETE CASCADE | Role foreign key |
| `permission_id` | UUID | NOT NULL, REFERENCES permissions(id) ON DELETE CASCADE | Permission foreign key |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Mapping timestamp |

Primary Key: `(role_id, permission_id)`

---

### 2.7. `organization_members`
Maps users into tenant organizations with assigned roles, activity status, and invitation tracking.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique membership record identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES organizations(id) ON DELETE CASCADE | Target tenant organization |
| `user_id` | UUID | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | Member user ID |
| `role_id` | UUID | NOT NULL, REFERENCES roles(id) | Assigned organization role |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Active flag for this organization |
| `invitation_status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACCEPTED' | `PENDING` or `ACCEPTED` |
| `invited_by` | UUID | NULLABLE, REFERENCES profiles(id) | Admin who initiated the invite |
| `invited_at` | TIMESTAMPTZ | NULLABLE | Timestamp when invitation was sent |
| `joined_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp when user joined / accepted |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record update timestamp |

**Indexes & Constraints**:
- Unique constraint: `UNIQUE (organization_id, user_id)`
- `idx_org_members_user` on `organization_members(user_id)`
- `idx_org_members_org` on `organization_members(organization_id)`
- `idx_org_members_status` on `organization_members(invitation_status)`

---

### 2.8. `audit_logs`
Immutable record of security and administrative actions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique audit entry identifier |
| `organization_id` | UUID | NULLABLE, REFERENCES organizations(id) ON DELETE SET NULL | Organization context |
| `user_id` | UUID | NULLABLE, REFERENCES profiles(id) ON DELETE SET NULL | Actor user ID |
| `action` | VARCHAR(100) | NOT NULL | Action name (e.g., `ORGANIZATION_PROVISIONED`, `USER_INVITED`, `ROLE_UPDATED`) |
| `resource` | VARCHAR(50) | NOT NULL | Target entity |
| `resource_id` | VARCHAR(255)| NULLABLE | Identifier of modified record |
| `metadata` | JSONB | NOT NULL, DEFAULT '{}' | Additional context, old/new states, IP |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Event timestamp |

---

## 3. Database Security & Helper Functions

1. **`auth_user_is_platform_admin(user_id UUID)`**:
   Returns boolean indicating if the given user is present in `platform_admins`.
2. **`auth_user_has_org_membership(target_org_id UUID)`**:
   Returns boolean indicating if `auth.uid()` has an active membership in the target organization or is a Platform Admin.
3. **`enforce_active_admin_retention()`**:
   Trigger function preventing the accidental deactivation or demotion of an organization's sole active Admin.


---

### 2.9. `accounts`
Stores business accounts, clients, and partner companies scoped to an organization.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique account identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES organizations(id) ON DELETE CASCADE | Tenant isolation scoping |
| `owner_user_id` | UUID | NULLABLE, REFERENCES profiles(id) ON DELETE SET NULL | Assigned account owner / sales rep |
| `created_by` | UUID | NOT NULL, REFERENCES profiles(id) | Creator profile ID |
| `name` | VARCHAR(255) | NOT NULL | Company name |
| `account_type` | VARCHAR(50) | NOT NULL, DEFAULT 'PROSPECT' | `PROSPECT`, `CUSTOMER`, `PARTNER`, `RESELLER`, `OTHER` |
| `industry` | VARCHAR(100) | NULLABLE | Business vertical / industry |
| `website` | VARCHAR(255) | NULLABLE | Company website URL |
| `phone` | VARCHAR(50) | NULLABLE | Primary business phone |
| `email` | VARCHAR(255) | NULLABLE | Primary corporate email |
| `annual_revenue` | NUMERIC(15,2)| NULLABLE | Annual revenue |
| `employee_count` | INTEGER | NULLABLE | Number of employees |
| `description` | TEXT | NULLABLE | Account overview and background |
| `billing_street` | TEXT | NULLABLE | Billing address street |
| `billing_city` | VARCHAR(100) | NULLABLE | Billing address city |
| `billing_state` | VARCHAR(100) | NULLABLE | Billing address state |
| `billing_country` | VARCHAR(100) | NULLABLE | Billing address country |
| `billing_postal_code`| VARCHAR(20) | NULLABLE | Billing postal code |
| `shipping_street` | TEXT | NULLABLE | Shipping address street |
| `shipping_city` | VARCHAR(100) | NULLABLE | Shipping address city |
| `shipping_state` | VARCHAR(100) | NULLABLE | Shipping address state |
| `shipping_country` | VARCHAR(100) | NULLABLE | Shipping address country |
| `shipping_postal_code`| VARCHAR(20) | NULLABLE | Shipping postal code |
| `is_deleted` | BOOLEAN | NOT NULL, DEFAULT false | Soft-deletion flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Modification timestamp |

**Indexes**:
- `idx_accounts_org_deleted` on `(organization_id, is_deleted)`
- `idx_accounts_owner` on `(owner_user_id)`
- `idx_accounts_name` on `(organization_id, name)`

---

### 2.10. `contacts`
Stores individual business contacts optionally associated with an account.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique contact identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES organizations(id) ON DELETE CASCADE | Tenant isolation scoping |
| `account_id` | UUID | NULLABLE, REFERENCES accounts(id) ON DELETE SET NULL | Associated company account |
| `owner_user_id` | UUID | NULLABLE, REFERENCES profiles(id) ON DELETE SET NULL | Assigned contact owner |
| `created_by` | UUID | NOT NULL, REFERENCES profiles(id) | Creator profile ID |
| `first_name` | VARCHAR(100) | NULLABLE | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `title` | VARCHAR(100) | NULLABLE | Job title |
| `department` | VARCHAR(100) | NULLABLE | Department |
| `email` | VARCHAR(255) | NULLABLE | Email address |
| `phone` | VARCHAR(50) | NULLABLE | Work phone |
| `mobile` | VARCHAR(50) | NULLABLE | Mobile phone |
| `description` | TEXT | NULLABLE | Background notes |
| `mailing_street` | TEXT | NULLABLE | Mailing street |
| `mailing_city` | VARCHAR(100) | NULLABLE | Mailing city |
| `mailing_state` | VARCHAR(100) | NULLABLE | Mailing state |
| `mailing_country` | VARCHAR(100) | NULLABLE | Mailing country |
| `mailing_postal_code`| VARCHAR(20) | NULLABLE | Mailing postal code |
| `is_deleted` | BOOLEAN | NOT NULL, DEFAULT false | Soft-deletion flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Modification timestamp |

**Indexes & Triggers**:
- `idx_contacts_org_deleted` on `(organization_id, is_deleted)`
- `idx_contacts_account` on `(account_id)`
- `idx_contacts_owner` on `(owner_user_id)`
- Trigger `enforce_contact_account_org_match`: Asserts that `contacts.account_id` belongs to the identical `organization_id`.

---

### 2.11. `leads`
Stores prospective customers and incoming enquiries prior to account qualification.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique lead identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES organizations(id) ON DELETE CASCADE | Tenant isolation scoping |
| `owner_user_id` | UUID | NULLABLE, REFERENCES profiles(id) ON DELETE SET NULL | Assigned lead owner |
| `created_by` | UUID | NOT NULL, REFERENCES profiles(id) | Creator profile ID |
| `first_name` | VARCHAR(100) | NULLABLE | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `company` | VARCHAR(255) | NOT NULL | Lead company / organization |
| `title` | VARCHAR(100) | NULLABLE | Job title |
| `email` | VARCHAR(255) | NULLABLE | Email address |
| `phone` | VARCHAR(50) | NULLABLE | Phone number |
| `mobile` | VARCHAR(50) | NULLABLE | Mobile phone |
| `website` | VARCHAR(255) | NULLABLE | Company website |
| `industry` | VARCHAR(100) | NULLABLE | Industry vertical |
| `source` | VARCHAR(50) | NOT NULL, DEFAULT 'OTHER' | `WEBSITE`, `REFERRAL`, `SOCIAL_MEDIA`, `COLD_CALL`, etc. |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'NEW' | `NEW`, `CONTACTED`, `QUALIFIED`, `UNQUALIFIED` |
| `rating` | VARCHAR(20) | NOT NULL, DEFAULT 'WARM' | `HOT`, `WARM`, `COLD` |
| `annual_revenue` | NUMERIC(15,2)| NULLABLE | Estimated annual revenue |
| `employee_count` | INTEGER | NULLABLE | Estimated employees |
| `description` | TEXT | NULLABLE | Lead requirements and notes |
| `street` | TEXT | NULLABLE | Address street |
| `city` | VARCHAR(100) | NULLABLE | Address city |
| `state` | VARCHAR(100) | NULLABLE | Address state |
| `country` | VARCHAR(100) | NULLABLE | Address country |
| `postal_code` | VARCHAR(20) | NULLABLE | Postal code |
| `converted_at` | TIMESTAMPTZ | NULLABLE | Conversion timestamp |
| `converted_account_id`| UUID | NULLABLE, REFERENCES accounts(id) | Generated/linked account |
| `converted_contact_id`| UUID | NULLABLE, REFERENCES contacts(id) | Generated/linked contact |
| `is_deleted` | BOOLEAN | NOT NULL, DEFAULT false | Soft-deletion flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Modification timestamp |

**Indexes**:
- `idx_leads_org_deleted` on `(organization_id, is_deleted)`
- `idx_leads_status` on `(organization_id, status)`
- `idx_leads_rating` on `(organization_id, rating)`
- `idx_leads_owner` on `(owner_user_id)`

---

## 4. Atomic Lead Conversion Procedure

Stored Procedure: `convert_lead_atomic(...)` (`SECURITY DEFINER`)
- Executes in an atomic PostgreSQL transaction.
- Validates that the lead exists, belongs to the caller's organization, and has not yet been converted.
- Provisions new `accounts` and/or `contacts` records within the same organization, copying address, contact info, and company details.
- Updates the lead's status to `QUALIFIED`, sets `converted_at = NOW()`, and records `converted_account_id` and `converted_contact_id`.
- Returns `{ leadId, accountId, contactId, convertedAt }` in JSON format.
