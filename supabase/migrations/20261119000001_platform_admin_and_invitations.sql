-- =============================================================================
-- Migration: 20261119000001_platform_admin_and_invitations.sql
-- Description: Salesforce-style Organization-Controlled Access & Platform Admin
-- Adds:
--  1. platform_admins table for independent Platform Admin identity & privileges
--  2. organizations.status (ACTIVE / SUSPENDED) & created_by
--  3. profiles.is_platform_admin & profiles.invitation_status
--  4. organization_members.invitation_status, invited_by, invited_at
--  5. Comprehensive RLS policies and security checks
-- =============================================================================

-- Step 1: Add status and created_by to organizations
DO $$
BEGIN
    -- Add status column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'status'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'SUSPENDED'));
        
        RAISE NOTICE 'Step 1.1: Added status column to organizations';
    END IF;

    -- Add created_by column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Step 1.2: Added created_by column to organizations';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- Step 2: Add platform admin flag and invitation status to profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_platform_admin'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN is_platform_admin BOOLEAN NOT NULL DEFAULT false;
        
        RAISE NOTICE 'Step 2.1: Added is_platform_admin to profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'invitation_status'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN invitation_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (invitation_status IN ('PENDING', 'ACCEPTED', 'ACTIVE'));
        
        RAISE NOTICE 'Step 2.2: Added invitation_status to profiles';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_platform_admin ON profiles(is_platform_admin);

-- Step 3: Add invitation tracking fields to organization_members
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organization_members' AND column_name = 'invitation_status'
    ) THEN
        ALTER TABLE organization_members 
        ADD COLUMN invitation_status VARCHAR(20) NOT NULL DEFAULT 'ACCEPTED'
        CHECK (invitation_status IN ('PENDING', 'ACCEPTED'));
        
        RAISE NOTICE 'Step 3.1: Added invitation_status to organization_members';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organization_members' AND column_name = 'invited_by'
    ) THEN
        ALTER TABLE organization_members 
        ADD COLUMN invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Step 3.2: Added invited_by to organization_members';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organization_members' AND column_name = 'invited_at'
    ) THEN
        ALTER TABLE organization_members 
        ADD COLUMN invited_at TIMESTAMPTZ DEFAULT NOW();
        
        RAISE NOTICE 'Step 3.3: Added invited_at to organization_members';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_org_members_invitation_status ON organization_members(invitation_status);

-- Step 4: Create dedicated platform_admins table
CREATE TABLE IF NOT EXISTS platform_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_admins_user_id ON platform_admins(user_id);
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Step 5: Helper function to verify if auth.uid() is a Platform Admin
CREATE OR REPLACE FUNCTION auth_user_is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (
        EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
    );
$$;

-- Step 6: Update auth_user_has_org_membership to enforce ACTIVE organization status
CREATE OR REPLACE FUNCTION auth_user_has_org_membership(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM organization_members om
        JOIN organizations o ON om.organization_id = o.id
        WHERE om.organization_id = p_org_id
          AND om.user_id = auth.uid()
          AND om.is_active = true
          AND o.status = 'ACTIVE'
    );
$$;

-- Step 7: Update RLS policies for Platform Admins and Organization Access
-- Platform admins can select and manage platform_admins table
DROP POLICY IF EXISTS "Platform admins can view platform admin list" ON platform_admins;
CREATE POLICY "Platform admins can view platform admin list"
    ON platform_admins FOR SELECT
    USING (auth_user_is_platform_admin());

-- Platform admins can view all organizations
DROP POLICY IF EXISTS "Platform admins can view all organizations" ON organizations;
CREATE POLICY "Platform admins can view all organizations"
    ON organizations FOR SELECT
    USING (auth_user_is_platform_admin());

-- Platform admins can insert organizations
DROP POLICY IF EXISTS "Platform admins can create organizations" ON organizations;
CREATE POLICY "Platform admins can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (auth_user_is_platform_admin());

-- Platform admins can update organizations
DROP POLICY IF EXISTS "Platform admins can update all organizations" ON organizations;
CREATE POLICY "Platform admins can update all organizations"
    ON organizations FOR UPDATE
    USING (auth_user_is_platform_admin());

-- Platform admins can view all organization members
DROP POLICY IF EXISTS "Platform admins can view all organization members" ON organization_members;
CREATE POLICY "Platform admins can view all organization members"
    ON organization_members FOR SELECT
    USING (auth_user_is_platform_admin());

-- Step 8: Add platform-level and user invitation permissions
INSERT INTO permissions (name, resource, action, description)
VALUES 
    ('platform:org:create', 'platform_organizations', 'create', 'Create new tenant organizations and assign initial admins'),
    ('platform:org:read', 'platform_organizations', 'read', 'View all tenant organizations across the platform'),
    ('platform:org:update', 'platform_organizations', 'update', 'Update organization settings and slug across the platform'),
    ('platform:org:status', 'platform_organizations', 'status', 'Activate or suspend tenant organizations'),
    ('users:resend_invite', 'users', 'resend_invite', 'Resend invitation email to pending organization members')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action;
