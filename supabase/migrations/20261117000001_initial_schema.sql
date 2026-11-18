-- =============================================================================
-- Migration: 20261117000001_initial_schema.sql
-- Description: Core Schema for Modern CRM Platform - Foundation and Module 01
-- Tables: organizations, profiles, roles, permissions, role_permissions, 
--         organization_members, audit_logs
-- Functions & RLS: Helper functions, triggers, and comprehensive RLS policies
-- =============================================================================

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Create universal trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Step 4: Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(1024),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Step 5: Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);

-- Step 7: Create role_permissions join table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Step 8: Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_organization_member UNIQUE (organization_id, user_id)
);

DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;
CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role_id ON organization_members(role_id);

-- Step 9: Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Step 10: Create Atomic Provisioning Stored Function
-- Transactionally sets up User Profile, Organization, and assigns Admin role
CREATE OR REPLACE FUNCTION provision_new_organization_and_admin(
    p_user_id UUID,
    p_org_name TEXT,
    p_org_slug TEXT,
    p_full_name TEXT,
    p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_role_id UUID;
    v_org_id UUID;
    v_member_id UUID;
    v_final_slug TEXT;
    v_slug_suffix INT := 1;
BEGIN
    RAISE NOTICE 'Step 1: Starting provisioning for user %, org %', p_user_id, p_org_name;

    -- Step 2: Fetch the ADMIN role ID
    SELECT id INTO v_admin_role_id FROM roles WHERE name = 'ADMIN' LIMIT 1;
    IF v_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'ADMIN role not found in database. Ensure roles are seeded.';
    END IF;

    -- Step 3: Ensure unique slug for organization
    v_final_slug := p_org_slug;
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_final_slug) LOOP
        v_final_slug := p_org_slug || '-' || v_slug_suffix;
        v_slug_suffix := v_slug_suffix + 1;
    END LOOP;

    -- Step 4: Upsert user profile
    INSERT INTO profiles (id, full_name, email, is_active)
    VALUES (p_user_id, p_full_name, p_email, true)
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = NOW();

    RAISE NOTICE 'Step 4 completed: Profile created/updated for %', p_user_id;

    -- Step 5: Insert new organization
    INSERT INTO organizations (name, slug)
    VALUES (p_org_name, v_final_slug)
    RETURNING id INTO v_org_id;

    RAISE NOTICE 'Step 5 completed: Organization created with id %, slug %', v_org_id, v_final_slug;

    -- Step 6: Create organization membership with ADMIN role
    INSERT INTO organization_members (organization_id, user_id, role_id, is_active)
    VALUES (v_org_id, p_user_id, v_admin_role_id, true)
    RETURNING id INTO v_member_id;

    RAISE NOTICE 'Step 6 completed: Organization member created with id %', v_member_id;

    -- Step 7: Record audit log for provisioning
    INSERT INTO audit_logs (organization_id, user_id, action, resource, resource_id, metadata)
    VALUES (
        v_org_id,
        p_user_id,
        'ORGANIZATION_PROVISIONED',
        'organizations',
        v_org_id::text,
        jsonb_build_object(
            'organization_name', p_org_name,
            'organization_slug', v_final_slug,
            'initial_admin_id', p_user_id
        )
    );

    RAISE NOTICE 'Step 7 completed: Audit log recorded';

    -- Step 8: Return structured response
    RETURN jsonb_build_object(
        'organization_id', v_org_id,
        'organization_name', p_org_name,
        'organization_slug', v_final_slug,
        'member_id', v_member_id,
        'role', 'ADMIN'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Provisioning failed: %', SQLERRM;
END;
$$;

-- Step 11: Enable Row Level Security (RLS) on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 12: Define RLS Helper Functions (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION auth_user_has_org_membership(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = p_org_id
          AND user_id = auth.uid()
          AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION auth_user_is_org_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM organization_members om
        JOIN roles r ON om.role_id = r.id
        WHERE om.organization_id = p_org_id
          AND om.user_id = auth.uid()
          AND om.is_active = true
          AND r.name = 'ADMIN'
    );
$$;

-- Step 13: Define RLS Policies

-- Profiles Policies
CREATE POLICY "Users can view profiles in their organizations or their own profile"
    ON profiles FOR SELECT
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM organization_members om1
            JOIN organization_members om2 ON om1.organization_id = om2.organization_id
            WHERE om1.user_id = auth.uid()
              AND om2.user_id = profiles.id
              AND om1.is_active = true
        )
    );

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Organizations Policies
CREATE POLICY "Members can view their own organizations"
    ON organizations FOR SELECT
    USING (auth_user_has_org_membership(id));

CREATE POLICY "Admins can update their organization"
    ON organizations FOR UPDATE
    USING (auth_user_is_org_admin(id))
    WITH CHECK (auth_user_is_org_admin(id));

-- Roles and Permissions Policies (Readable by authenticated users)
CREATE POLICY "Authenticated users can view roles"
    ON roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view permissions"
    ON permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view role permissions"
    ON role_permissions FOR SELECT
    TO authenticated
    USING (true);

-- Organization Members Policies
CREATE POLICY "Members can view other members in their organization"
    ON organization_members FOR SELECT
    USING (auth_user_has_org_membership(organization_id));

CREATE POLICY "Admins can update members in their organization"
    ON organization_members FOR UPDATE
    USING (auth_user_is_org_admin(organization_id))
    WITH CHECK (auth_user_is_org_admin(organization_id));

-- Audit Logs Policies
CREATE POLICY "Admins can view audit logs for their organization"
    ON audit_logs FOR SELECT
    USING (auth_user_is_org_admin(organization_id));
