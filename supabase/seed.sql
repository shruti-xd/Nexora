-- =============================================================================
-- Seed: seed.sql
-- Description: Initial system roles, core permissions, and role permission mappings
-- =============================================================================

-- Step 1: Insert standard system roles
INSERT INTO roles (name, description, is_system_role)
VALUES 
    ('ADMIN', 'Full access to organization settings, team members, and all CRM resources', true),
    ('MANAGER', 'Team level management, CRM record oversight, no organization setting modifications', true),
    ('SALES_REP', 'Standard sales user managing assigned CRM accounts, leads, and deals', true),
    ('VIEWER', 'Read-only access across permitted CRM records', true)
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    is_system_role = EXCLUDED.is_system_role;

-- Step 2: Insert core permissions
INSERT INTO permissions (name, resource, action, description)
VALUES 
    -- Organization permissions
    ('org:read', 'organizations', 'read', 'View organization details and profile'),
    ('org:update', 'organizations', 'update', 'Modify organization settings and name'),
    ('org:delete', 'organizations', 'delete', 'Delete organization (Super Admin only)'),

    -- User & Membership permissions
    ('users:read', 'users', 'read', 'View organization team members and profiles'),
    ('users:invite', 'users', 'invite', 'Invite new team members to organization'),
    ('users:update_role', 'users', 'update_role', 'Modify roles of organization members'),
    ('users:update_status', 'users', 'update_status', 'Activate or deactivate team members'),
    ('users:remove', 'users', 'remove', 'Remove members from organization'),

    -- Audit Log permissions
    ('audit:read', 'audit_logs', 'read', 'View organization security and audit trails'),

    -- Future CRM Module Placeholders (prepared for upcoming modules)
    ('leads:read', 'leads', 'read', 'View sales leads'),
    ('leads:create', 'leads', 'create', 'Create new sales leads'),
    ('leads:update', 'leads', 'update', 'Edit sales leads'),
    ('leads:delete', 'leads', 'delete', 'Delete sales leads'),

    ('accounts:read', 'accounts', 'read', 'View company accounts'),
    ('accounts:create', 'accounts', 'create', 'Create company accounts'),
    ('accounts:update', 'accounts', 'update', 'Edit company accounts'),
    ('accounts:delete', 'accounts', 'delete', 'Delete company accounts'),

    ('contacts:read', 'contacts', 'read', 'View individual contacts'),
    ('contacts:create', 'contacts', 'create', 'Create individual contacts'),
    ('contacts:update', 'contacts', 'update', 'Edit individual contacts'),
    ('contacts:delete', 'contacts', 'delete', 'Delete individual contacts'),

    ('opportunities:read', 'opportunities', 'read', 'View sales pipeline and deals'),
    ('opportunities:create', 'opportunities', 'create', 'Create deals and pipeline items'),
    ('opportunities:update', 'opportunities', 'update', 'Edit deals and pipeline items'),
    ('opportunities:delete', 'opportunities', 'delete', 'Delete deals and pipeline items')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action;

-- Step 3: Map permissions to roles
-- ADMIN gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- MANAGER gets team, org read, audit read, and CRM read/create/update
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'MANAGER'
  AND p.name IN (
    'org:read',
    'users:read',
    'audit:read',
    'leads:read', 'leads:create', 'leads:update',
    'accounts:read', 'accounts:create', 'accounts:update',
    'contacts:read', 'contacts:create', 'contacts:update',
    'opportunities:read', 'opportunities:create', 'opportunities:update'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- SALES_REP gets org read and CRM read/create/update
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SALES_REP'
  AND p.name IN (
    'org:read',
    'users:read',
    'leads:read', 'leads:create', 'leads:update',
    'accounts:read', 'accounts:create', 'accounts:update',
    'contacts:read', 'contacts:create', 'contacts:update',
    'opportunities:read', 'opportunities:create', 'opportunities:update'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- VIEWER gets read-only permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'VIEWER'
  AND p.name IN (
    'org:read',
    'users:read',
    'leads:read',
    'accounts:read',
    'contacts:read',
    'opportunities:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
