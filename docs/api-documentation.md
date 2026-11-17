# Modern CRM Platform — REST API Documentation (v1)

## 1. Overview
All CRM business APIs are prefixed with `/api/v1`. All endpoints follow standard HTTP response codes and return a consistent JSON envelope.

### 1.1. Response Format
#### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

#### Standard Error Response
```json
{
  "success": false,
  "message": "A meaningful error message",
  "error": {
    "code": "ERROR_CODE",
    "details": null
  }
}
```

---

## 2. Authentication & Headers

| Header | Format | Required | Description |
| :--- | :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | Yes (for protected endpoints) | Cryptographically validated Supabase JWT |
| `Content-Type` | `application/json` | Yes (for POST/PATCH requests) | Payload MIME type |
| `x-organization-id` | `<UUID>` | Optional | Organization workspace ID override |

---

## 3. Endpoints

### 3.1. Health Check
`GET /api/v1/health`
- **Auth**: None
- **Description**: Returns server uptime, operational status, and current timestamp.
- **Response**: `200 OK`

---

### 3.2. Authentication & Profile

#### Register New Account and Provision Workspace
`POST /api/v1/auth/register`
- **Auth**: None (Rate-limited: 20 attempts / 15 mins)
- **Request Body**:
```json
{
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "organizationName": "Acme Global Solutions"
}
```
- **Validation**:
  - `email`: Valid email format
  - `password`: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special symbol
  - `confirmPassword`: Must exactly match password
  - `organizationName`: 2–100 characters
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Registration and workspace provisioning completed successfully",
  "data": {
    "user": {
      "id": "7b897931-...",
      "email": "jane.doe@example.com",
      "fullName": "Jane Doe"
    },
    "organization": {
      "id": "c138d672-...",
      "name": "Acme Global Solutions",
      "slug": "acme-global-solutions",
      "role": "ADMIN"
    },
    "session": {
      "access_token": "...",
      "refresh_token": "..."
    }
  }
}
```
- **Errors**: `400 VALIDATION_ERROR`, `409 REGISTRATION_FAILED` (Duplicate email)

#### Get Current User Context
`GET /api/v1/auth/me`
- **Auth**: Required (`Bearer <token>`)
- **Description**: Fetches the authenticated user profile, active workspace, current role, and granted permissions.
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Current user profile retrieved successfully",
  "data": {
    "user": {
      "id": "7b897931-...",
      "email": "jane.doe@example.com",
      "fullName": "Jane Doe",
      "avatarUrl": null,
      "isActive": true,
      "createdAt": "2026-11-17T12:00:00Z"
    },
    "organization": {
      "id": "c138d672-...",
      "name": "Acme Global Solutions",
      "slug": "acme-global-solutions",
      "createdAt": "2026-11-17T12:00:00Z"
    },
    "membership": {
      "id": "e58129d2-...",
      "role": "ADMIN",
      "isActive": true,
      "joinedAt": "2026-11-17T12:00:00Z"
    },
    "permissions": ["org:read", "org:update", "users:read", "users:update_role", "users:update_status", "audit:read"]
  }
}
```

#### Update User Profile
`PATCH /api/v1/auth/me`
- **Auth**: Required
- **Request Body**:
```json
{
  "fullName": "Jane D. Smith",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```
- **Response**: `200 OK`

#### Application Logout Audit
`POST /api/v1/auth/logout`
- **Auth**: Required
- **Description**: Records server-side logout audit trail. Client-side session termination is finalized by Supabase SDK.
- **Response**: `200 OK`

---

### 3.3. Organization Management

#### Get Current Organization Details
`GET /api/v1/organizations/current`
- **Auth**: Required (Permission `org:read`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Current organization retrieved successfully",
  "data": {
    "id": "c138d672-...",
    "name": "Acme Global Solutions",
    "slug": "acme-global-solutions",
    "createdAt": "2026-11-17T12:00:00Z",
    "updatedAt": "2026-11-17T12:00:00Z",
    "memberCount": 4,
    "currentUserRole": "ADMIN"
  }
}
```

#### Update Current Organization
`PATCH /api/v1/organizations/current`
- **Auth**: Required (Permission `org:update` / Role `ADMIN`)
- **Request Body**:
```json
{
  "name": "Acme Enterprises Inc."
}
```
- **Response**: `200 OK`
- **Errors**: `403 FORBIDDEN_PERMISSION`

---

### 3.4. Team & User Management

#### List Organization Members
`GET /api/v1/users`
- **Auth**: Required (Permission `users:read`)
- **Query Parameters**:
  - `page`: Page number (integer, default: 1)
  - `limit`: Items per page (integer, default: 10, max: 100)
  - `search`: Filter string against name and email (optional)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Organization members retrieved successfully",
  "data": {
    "members": [
      {
        "membershipId": "...",
        "userId": "...",
        "fullName": "Jane Doe",
        "email": "jane.doe@example.com",
        "avatarUrl": null,
        "role": "ADMIN",
        "roleDescription": "Full access to organization settings",
        "isMemberActive": true,
        "isProfileActive": true,
        "joinedAt": "2026-11-17T12:00:00Z"
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

#### Get Member By ID
`GET /api/v1/users/:id`
- **Auth**: Required (Permission `users:read`)
- **Parameters**: `id` (UUID of user)
- **Response**: `200 OK`
- **Errors**: `404 FETCH_MEMBER_FAILED`

#### Update Member Role
`PATCH /api/v1/users/:id/role`
- **Auth**: Required (Role `ADMIN`, Permission `users:update_role`)
- **Parameters**: `id` (UUID of target user)
- **Request Body**:
```json
{
  "role": "MANAGER"
}
```
- **Allowed Roles**: `ADMIN`, `MANAGER`, `SALES_REP`, `VIEWER`
- **Enforced Security Constraints**:
  - Users cannot modify their own role (`400 UPDATE_ROLE_FAILED`)
  - Target user must belong to the active organization (`400 UPDATE_ROLE_FAILED`)
  - Cannot demote the organization's last remaining active Admin (`400 UPDATE_ROLE_FAILED`)
- **Response**: `200 OK`

#### Update Member Active Status
`PATCH /api/v1/users/:id/status`
- **Auth**: Required (Role `ADMIN`, Permission `users:update_status`)
- **Parameters**: `id` (UUID of target user)
- **Request Body**:
```json
{
  "isActive": false
}
```
- **Enforced Security Constraints**:
  - Users cannot deactivate themselves (`400 UPDATE_STATUS_FAILED`)
  - Cannot deactivate the organization's last remaining active Admin (`400 UPDATE_STATUS_FAILED`)
- **Response**: `200 OK`
