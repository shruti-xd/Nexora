# Nexora CRM — REST API Documentation (v1)

## Base URL
```
http://localhost:5000/api/v1
```

Interactive Swagger / OpenAPI UI: `http://localhost:5000/api/docs`

---

## Standard Response Envelopes

### Success Envelope (200 OK, 201 Created)
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

### Error Envelope (400, 401, 403, 404, 409, 500)
```json
{
  "success": false,
  "message": "Detailed error explanation.",
  "error": {
    "code": "ERROR_CODE_IDENTIFIER",
    "details": null
  }
}
```

---

## 1. Authentication & Profile Endpoints

> **Important**: Public self-registration (`POST /auth/register`) has been **decommissioned**. All users are provisioned via Platform Admin or invited by an Organization Admin.

### `GET /auth/me`
Retrieves the authenticated user's profile, active organization context, membership details, and permissions.
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "message": "Authenticated user profile and context retrieved.",
  "data": {
    "user": {
      "id": "c1f7b09e-0000-0000-0000-000000000001",
      "email": "user@company.com",
      "fullName": "Jane Doe",
      "avatarUrl": null,
      "isActive": true,
      "isPlatformAdmin": false,
      "invitationStatus": "ACTIVE",
      "createdAt": "2026-11-17T12:00:00.000Z"
    },
    "organization": {
      "id": "e4b3c2a1-0000-0000-0000-000000000002",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "status": "ACTIVE"
    },
    "membership": {
      "id": "f8a7b6c5-0000-0000-0000-000000000003",
      "role": "ADMIN",
      "isActive": true,
      "invitationStatus": "ACCEPTED"
    },
    "role": "ADMIN",
    "permissions": ["users:invite", "users:update_role", "users:update_status", "users:read", "..."]
  }
}
```

### `PATCH /auth/me`
Updates user profile metadata (e.g. `fullName`, `avatarUrl`).
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
```json
{
  "fullName": "Jane Smith"
}
```

### `POST /auth/logout`
Audits the termination of the current session.
- **Headers**: `Authorization: Bearer <token>`

---

## 2. Platform Administration Endpoints (`/platform/*`)

> **Access Requirement**: Strictly restricted to authenticated users verified in the `platform_admins` table. Non-platform users receive `403 FORBIDDEN_PLATFORM_ADMIN`.

### `POST /platform/organizations`
Provisions a new tenant organization and assigns/invites its initial Organization Administrator.
- **Payload**:
```json
{
  "name": "Acme Global Solutions",
  "slug": "acme-global",
  "adminFullName": "Alexander Hayes",
  "adminEmail": "alexander.hayes@acmeglobal.com"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Organization provisioned successfully.",
  "data": {
    "id": "e4b3c2a1-1234-5678-90ab-cdef12345678",
    "name": "Acme Global Solutions",
    "slug": "acme-global",
    "status": "ACTIVE",
    "createdAt": "2026-11-19T10:00:00.000Z",
    "initialAdmin": {
      "id": "a1b2c3d4-1234-5678-90ab-cdef12345678",
      "email": "alexander.hayes@acmeglobal.com",
      "fullName": "Alexander Hayes"
    }
  }
}
```

### `GET /platform/organizations`
Lists organizations across the platform with pagination and status filtering.
- **Query Parameters**:
  - `page`: default `1`
  - `limit`: default `10`
  - `search`: string (matches name or slug)
  - `status`: `ALL` | `ACTIVE` | `SUSPENDED`

### `GET /platform/organizations/:id`
Retrieves detailed information for a specific organization, including member count and primary administrator.

### `PATCH /platform/organizations/:id`
Updates organization metadata (e.g., `name`, `slug`).

### `PATCH /platform/organizations/:id/status`
Toggles organization between `ACTIVE` and `SUSPENDED`.
- **Payload**:
```json
{
  "status": "SUSPENDED"
}
```

### `POST /platform/organizations/:id/admin`
Assigns or invites a primary Organization Administrator for an organization.
- **Payload**:
```json
{
  "adminEmail": "new.admin@acmeglobal.com",
  "adminFullName": "Elena Rostova"
}
```

---

## 3. Organization User Management Endpoints (`/users/*`)

> **Access Requirement**: Authenticated member of the organization. Administrative operations require `ADMIN` role.

### `GET /users`
Lists members of the current user's organization.
- **Query Parameters**:
  - `page`: default `1`
  - `limit`: default `10`
  - `search`: string
  - `role`: `ALL` | `ADMIN` | `MANAGER` | `SALES_REP` | `VIEWER`
  - `status`: `ALL` | `ACTIVE` | `PENDING` | `DEACTIVATED`
- **Response**:
```json
{
  "success": true,
  "message": "Organization members retrieved.",
  "data": {
    "members": [
      {
        "membershipId": "f8a7b6c5-...",
        "userId": "c1f7b09e-...",
        "fullName": "Sarah Connor",
        "email": "sarah@company.com",
        "avatarUrl": null,
        "role": "SALES_REP",
        "roleDescription": "Standard sales representative",
        "isMemberActive": true,
        "isProfileActive": true,
        "invitationStatus": "PENDING",
        "invitedAt": "2026-11-19T14:30:00.000Z",
        "joinedAt": "2026-11-19T14:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
}
```

### `POST /users/invite`
Invites a new user to the organization by email (Organization Admin only).
- **Payload**:
```json
{
  "email": "sarah@company.com",
  "fullName": "Sarah Connor",
  "role": "SALES_REP"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "User invited to organization successfully.",
  "data": {
    "membershipId": "f8a7b6c5-...",
    "userId": "c1f7b09e-...",
    "email": "sarah@company.com",
    "role": "SALES_REP"
  }
}
```

### `POST /users/:id/resend-invitation`
Resends the Supabase Auth invitation email to a pending member.

### `PATCH /users/:id/role`
Updates a member's role (Organization Admin only).
- **Payload**:
```json
{
  "role": "MANAGER"
}
```

### `PATCH /users/:id/status`
Activates or deactivates a member's account access (Organization Admin only).
- **Payload**:
```json
{
  "isActive": false
}
```

---

## 4. Error Code Reference

| Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `UNAUTHORIZED` | 401 | Missing or malformed authorization header |
| `TOKEN_EXPIRED_OR_INVALID` | 401 | Cryptographic verification failed or token expired |
| `FORBIDDEN_PLATFORM_ADMIN` | 403 | Platform Administrator privileges required |
| `FORBIDDEN_ROLE` | 403 | Missing required organization role |
| `FORBIDDEN_PERMISSION` | 403 | Missing required granular permission |
| `FORBIDDEN_ORGANIZATION_SUSPENDED` | 403 | Organization is suspended |
| `ORGANIZATION_NOT_FOUND` | 404 | Organization ID does not exist |
| `USER_NOT_FOUND` | 404 | User ID does not exist |
| `SLUG_ALREADY_EXISTS` | 409 | Requested organization slug is already in use |
| `VALIDATION_ERROR` | 400 | Payload fails Zod schema validation rules |
| `CANNOT_MODIFY_SELF` | 400 | Admin attempted to demote or deactivate their own record |
| `CANNOT_REMOVE_LAST_ADMIN` | 400 | Action would leave organization without an active Admin |


---

## 5. Module 02: Leads, Accounts & Contacts Endpoints

### 5.1. Accounts Management (`/accounts`)

- `POST /accounts`: Create a business account within the active organization.
  - Requires permission: `accounts:create`
  - Payload: `{ name: string, accountType?: string, industry?: string, website?: string, phone?: string, email?: string, annualRevenue?: number, employeeCount?: number, description?: string, billingStreet?: string, billingCity?: string, billingState?: string, billingCountry?: string, billingPostalCode?: string, shippingStreet?: string, shippingCity?: string, shippingState?: string, shippingCountry?: string, shippingPostalCode?: string, ownerUserId?: string }`
- `GET /accounts`: List accounts with search, type filter, industry filter, and pagination.
  - Requires permission: `accounts:read`
  - Query parameters: `page`, `limit`, `search`, `accountType`, `industry`, `ownerId`, `sortBy`, `sortOrder`
- `GET /accounts/:id`: Get single account details by UUID with contact count.
  - Requires permission: `accounts:read`
- `PATCH /accounts/:id`: Update account fields.
  - Requires permission: `accounts:update`
- `DELETE /accounts/:id`: Soft-delete account (`is_deleted = true`).
  - Restricted to: `ADMIN` or `MANAGER` roles
- `GET /accounts/:id/contacts`: List all active contacts belonging to the specified account.
  - Requires permission: `contacts:read`

---

### 5.2. Contacts Management (`/contacts`)

- `POST /contacts`: Create a contact record within the active organization.
  - Requires permission: `contacts:create`
  - Payload: `{ lastName: string, firstName?: string, accountId?: string, title?: string, department?: string, email?: string, phone?: string, mobile?: string, description?: string, mailingStreet?: string, mailingCity?: string, mailingState?: string, mailingCountry?: string, mailingPostalCode?: string, ownerUserId?: string }`
  - Validates that `accountId` (if provided) belongs to the caller's organization.
- `GET /contacts`: List contacts with search (name, email, phone), account filter, and pagination.
  - Requires permission: `contacts:read`
  - Query parameters: `page`, `limit`, `search`, `accountId`, `ownerId`, `sortBy`, `sortOrder`
- `GET /contacts/:id`: Get single contact details by UUID.
  - Requires permission: `contacts:read`
- `PATCH /contacts/:id`: Update contact details.
  - Requires permission: `contacts:update`
- `DELETE /contacts/:id`: Soft-delete contact.
  - Restricted to: `ADMIN` or `MANAGER` roles

---

### 5.3. Leads Management & Conversion (`/leads`)

- `POST /leads`: Create a new lead record.
  - Requires permission: `leads:create`
  - Payload: `{ lastName: string, company: string, firstName?: string, title?: string, email?: string, phone?: string, mobile?: string, website?: string, industry?: string, source?: string, status?: string, rating?: string, annualRevenue?: number, employeeCount?: number, description?: string, street?: string, city?: string, state?: string, country?: string, postalCode?: string, ownerUserId?: string }`
- `GET /leads`: List leads with filters (`status`, `rating`, `source`, `isConverted`), search, and pagination.
  - Requires permission: `leads:read`
  - Query parameters: `page`, `limit`, `search`, `status`, `rating`, `source`, `isConverted`, `ownerId`, `sortBy`, `sortOrder`
- `GET /leads/:id`: Get lead details by UUID.
  - Requires permission: `leads:read`
- `PATCH /leads/:id`: Update lead details.
  - Requires permission: `leads:update`
- `DELETE /leads/:id`: Soft-delete lead.
  - Restricted to: `ADMIN` or `MANAGER` roles
- `POST /leads/:id/convert`: Atomically convert lead into Account and Contact.
  - Requires permission: `leads:convert`
  - Payload:
    ```json
    {
      "createNewAccount": true,
      "accountName": "Acme Technologies Inc.",
      "createNewContact": true,
      "contactFirstName": "Jane",
      "contactLastName": "Doe",
      "contactEmail": "jane@acme.com",
      "contactPhone": "+1-555-0100"
    }
    ```
  - Stored Procedure: Calls PostgreSQL `convert_lead_atomic(...)` in a single transaction.
  - Sets lead status to `QUALIFIED`, sets `converted_at = NOW()`, links `converted_account_id` and `converted_contact_id`.
