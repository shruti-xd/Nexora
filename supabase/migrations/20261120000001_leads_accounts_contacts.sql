-- =============================================================================
-- Migration: 20261120000001_leads_accounts_contacts.sql
-- Module 02: Leads, Accounts, and Contacts Management
-- =============================================================================

SET search_path = public, pg_catalog;

-- Step 0: Harmonize owner column names if older schema used owner_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'accounts' AND column_name = 'owner_id') THEN
        ALTER TABLE public.accounts RENAME COLUMN owner_id TO owner_user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'owner_id') THEN
        ALTER TABLE public.contacts RENAME COLUMN owner_id TO owner_user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'owner_id') THEN
        ALTER TABLE public.leads RENAME COLUMN owner_id TO owner_user_id;
    END IF;
END $$;

-- Step 1: Create accounts table or add missing columns
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL DEFAULT 'PROSPECT',
    industry VARCHAR(100),
    website VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    annual_revenue NUMERIC(15, 2),
    employee_count INTEGER,
    description TEXT,
    -- Billing Address
    billing_street VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_country VARCHAR(100),
    billing_postal_code VARCHAR(20),
    -- Shipping Address
    shipping_street VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_country VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    -- Soft Deletion & Timestamps
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) NOT NULL DEFAULT 'PROSPECT';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC(15, 2);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS employee_count INTEGER;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS billing_street VARCHAR(255);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(20);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS shipping_street VARCHAR(255);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.profiles(id);

-- Step 2: Create contacts table or add missing columns
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    first_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    description TEXT,
    -- Mailing Address
    mailing_street VARCHAR(255),
    mailing_city VARCHAR(100),
    mailing_state VARCHAR(100),
    mailing_country VARCHAR(100),
    mailing_postal_code VARCHAR(20),
    -- Other Address
    other_street VARCHAR(255),
    other_city VARCHAR(100),
    other_state VARCHAR(100),
    other_country VARCHAR(100),
    other_postal_code VARCHAR(20),
    -- Soft Deletion & Timestamps
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS title VARCHAR(100);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS mailing_street VARCHAR(255);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS mailing_city VARCHAR(100);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS mailing_state VARCHAR(100);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS mailing_country VARCHAR(100);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS mailing_postal_code VARCHAR(20);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS other_street VARCHAR(255);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS other_city VARCHAR(100);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS other_state VARCHAR(100);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS other_country VARCHAR(100);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS other_postal_code VARCHAR(20);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.profiles(id);

-- Step 3: Create leads table or add missing columns
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    first_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255) NOT NULL,
    title VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    website VARCHAR(255),
    industry VARCHAR(100),
    source VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    rating VARCHAR(20) NOT NULL DEFAULT 'WARM',
    annual_revenue NUMERIC(15, 2),
    employee_count INTEGER,
    description TEXT,
    -- Address Information
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    -- Conversion Tracking
    converted_at TIMESTAMPTZ,
    converted_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    converted_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    -- Soft Deletion & Timestamps
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS title VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'OTHER';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'NEW';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS rating VARCHAR(20) NOT NULL DEFAULT 'WARM';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC(15, 2);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS employee_count INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS street VARCHAR(255);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.profiles(id);

-- Drop legacy TitleCase check constraint if present and enforce uppercase check
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS chk_lead_status;
ALTER TABLE public.leads ADD CONSTRAINT chk_lead_status CHECK (UPPER(status) IN ('NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'));

-- Step 4: Triggers for automatic updated_at timestamps
CREATE OR REPLACE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enforce same-organization constraints for Contact-to-Account associations
CREATE OR REPLACE FUNCTION validate_contact_account_org()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.account_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = NEW.account_id 
              AND organization_id = NEW.organization_id 
              AND is_deleted = false
        ) THEN
            RAISE EXCEPTION 'Associated account does not exist or belongs to another organization';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER enforce_contact_account_org_match
    BEFORE INSERT OR UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION validate_contact_account_org();

-- Step 6: Create performance and query indexes
-- Accounts indexes
CREATE INDEX IF NOT EXISTS idx_accounts_org_deleted ON public.accounts(organization_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_accounts_owner ON public.accounts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_name ON public.accounts(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON public.accounts(organization_id, created_at DESC);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_org_deleted ON public.contacts(organization_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_contacts_account ON public.contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON public.contacts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON public.contacts(organization_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(organization_id, created_at DESC);

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_org_deleted ON public.leads(organization_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.leads(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_rating ON public.leads(organization_id, rating);
CREATE INDEX IF NOT EXISTS idx_leads_name ON public.leads(organization_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_leads_company ON public.leads(organization_id, company);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(organization_id, created_at DESC);

-- Step 7: Atomic Lead Conversion PostgreSQL Stored Function
CREATE OR REPLACE FUNCTION public.convert_lead_atomic(
    p_lead_id UUID,
    p_user_id UUID,
    p_create_new_account BOOLEAN,
    p_existing_account_id UUID,
    p_account_name VARCHAR(255),
    p_create_new_contact BOOLEAN,
    p_existing_contact_id UUID,
    p_contact_first_name VARCHAR(100),
    p_contact_last_name VARCHAR(100),
    p_contact_email VARCHAR(255),
    p_contact_phone VARCHAR(50)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lead RECORD;
    v_account_id UUID;
    v_contact_id UUID;
    v_org_id UUID;
BEGIN
    -- Step 7.1: Retrieve and lock the target lead
    SELECT * INTO v_lead
    FROM public.leads
    WHERE id = p_lead_id AND is_deleted = false
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'LEAD_NOT_FOUND: Lead record does not exist or has been deleted';
    END IF;

    IF v_lead.converted_at IS NOT NULL THEN
        RAISE EXCEPTION 'ALREADY_CONVERTED: Lead has already been converted at %', v_lead.converted_at;
    END IF;

    v_org_id := v_lead.organization_id;

    -- Step 7.2: Resolve or Create Account
    IF p_create_new_account THEN
        IF p_account_name IS NULL OR TRIM(p_account_name) = '' THEN
            RAISE EXCEPTION 'INVALID_ACCOUNT_NAME: Account name is required when creating a new account';
        END IF;

        INSERT INTO public.accounts (
            organization_id,
            owner_user_id,
            created_by,
            name,
            account_type,
            industry,
            website,
            phone,
            email,
            annual_revenue,
            employee_count,
            description,
            billing_street,
            billing_city,
            billing_state,
            billing_country,
            billing_postal_code,
            shipping_street,
            shipping_city,
            shipping_state,
            shipping_country,
            shipping_postal_code
        ) VALUES (
            v_org_id,
            v_lead.owner_user_id,
            p_user_id,
            TRIM(p_account_name),
            'PROSPECT',
            v_lead.industry,
            v_lead.website,
            v_lead.phone,
            v_lead.email,
            v_lead.annual_revenue,
            v_lead.employee_count,
            v_lead.description,
            v_lead.street,
            v_lead.city,
            v_lead.state,
            v_lead.country,
            v_lead.postal_code,
            v_lead.street,
            v_lead.city,
            v_lead.state,
            v_lead.country,
            v_lead.postal_code
        ) RETURNING id INTO v_account_id;
    ELSE
        -- Verify existing account belongs to same organization
        IF p_existing_account_id IS NULL THEN
            RAISE EXCEPTION 'ACCOUNT_REQUIRED: An existing account ID must be specified if not creating a new account';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = p_existing_account_id 
              AND organization_id = v_org_id 
              AND is_deleted = false
        ) THEN
            RAISE EXCEPTION 'ACCOUNT_NOT_FOUND: Specified existing account does not exist or belongs to another organization';
        END IF;

        v_account_id := p_existing_account_id;
    END IF;

    -- Step 7.3: Resolve or Create Contact
    IF p_create_new_contact THEN
        IF p_contact_last_name IS NULL OR TRIM(p_contact_last_name) = '' THEN
            RAISE EXCEPTION 'INVALID_CONTACT_NAME: Contact last name is required';
        END IF;

        INSERT INTO public.contacts (
            organization_id,
            account_id,
            owner_user_id,
            created_by,
            first_name,
            last_name,
            title,
            email,
            phone,
            mobile,
            description,
            mailing_street,
            mailing_city,
            mailing_state,
            mailing_country,
            mailing_postal_code
        ) VALUES (
            v_org_id,
            v_account_id,
            v_lead.owner_user_id,
            p_user_id,
            NULLIF(TRIM(p_contact_first_name), ''),
            TRIM(p_contact_last_name),
            v_lead.title,
            NULLIF(TRIM(p_contact_email), ''),
            NULLIF(TRIM(p_contact_phone), ''),
            v_lead.mobile,
            v_lead.description,
            v_lead.street,
            v_lead.city,
            v_lead.state,
            v_lead.country,
            v_lead.postal_code
        ) RETURNING id INTO v_contact_id;
    ELSE
        IF p_existing_contact_id IS NULL THEN
            RAISE EXCEPTION 'CONTACT_REQUIRED: An existing contact ID must be specified if not creating a new contact';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.contacts 
            WHERE id = p_existing_contact_id 
              AND organization_id = v_org_id 
              AND is_deleted = false
        ) THEN
            RAISE EXCEPTION 'CONTACT_NOT_FOUND: Specified existing contact does not exist or belongs to another organization';
        END IF;

        v_contact_id := p_existing_contact_id;
    END IF;

    -- Step 7.4: Update original lead record with conversion references
    UPDATE public.leads
    SET status = 'QUALIFIED',
        converted_at = NOW(),
        converted_account_id = v_account_id,
        converted_contact_id = v_contact_id,
        updated_at = NOW()
    WHERE id = p_lead_id;

    -- Step 7.5: Return JSON envelope with resolved entities
    RETURN jsonb_build_object(
        'leadId', p_lead_id,
        'accountId', v_account_id,
        'contactId', v_contact_id,
        'convertedAt', NOW()
    );
END;
$$;

-- Step 8: Register granular permissions for Module 02
INSERT INTO public.permissions (name, resource, action, description)
VALUES
    -- Leads permissions
    ('leads:create', 'leads', 'create', 'Create new leads in the organization'),
    ('leads:read', 'leads', 'read', 'View leads in the organization'),
    ('leads:update', 'leads', 'update', 'Edit leads in the organization'),
    ('leads:delete', 'leads', 'delete', 'Delete leads in the organization'),
    ('leads:convert', 'leads', 'convert', 'Convert qualified leads into accounts and contacts'),
    -- Accounts permissions
    ('accounts:create', 'accounts', 'create', 'Create new accounts in the organization'),
    ('accounts:read', 'accounts', 'read', 'View accounts in the organization'),
    ('accounts:update', 'accounts', 'update', 'Edit accounts in the organization'),
    ('accounts:delete', 'accounts', 'delete', 'Delete accounts in the organization'),
    -- Contacts permissions
    ('contacts:create', 'contacts', 'create', 'Create new contacts in the organization'),
    ('contacts:read', 'contacts', 'read', 'View contacts in the organization'),
    ('contacts:update', 'contacts', 'update', 'Edit contacts in the organization'),
    ('contacts:delete', 'contacts', 'delete', 'Delete contacts in the organization')
ON CONFLICT (name) DO NOTHING;

-- Step 9: Map permissions to standard system roles
-- ADMIN: Full permissions across all entities
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'ADMIN'
  AND p.name IN (
    'leads:create', 'leads:read', 'leads:update', 'leads:delete', 'leads:convert',
    'accounts:create', 'accounts:read', 'accounts:update', 'accounts:delete',
    'contacts:create', 'contacts:read', 'contacts:update', 'contacts:delete'
  )
ON CONFLICT DO NOTHING;

-- MANAGER: Full read, create, update, convert, and delete permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'MANAGER'
  AND p.name IN (
    'leads:create', 'leads:read', 'leads:update', 'leads:delete', 'leads:convert',
    'accounts:create', 'accounts:read', 'accounts:update', 'accounts:delete',
    'contacts:create', 'contacts:read', 'contacts:update', 'contacts:delete'
  )
ON CONFLICT DO NOTHING;

-- SALES_REP: Create, read, update, convert (no delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'SALES_REP'
  AND p.name IN (
    'leads:create', 'leads:read', 'leads:update', 'leads:convert',
    'accounts:create', 'accounts:read', 'accounts:update',
    'contacts:create', 'contacts:read', 'contacts:update'
  )
ON CONFLICT DO NOTHING;

-- VIEWER: Read-only access
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'VIEWER'
  AND p.name IN (
    'leads:read', 'accounts:read', 'contacts:read'
  )
ON CONFLICT DO NOTHING;

-- Step 10: Enable Row Level Security (RLS) on all Module 02 tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS policies for tenant data isolation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'accounts_org_isolation') THEN
        CREATE POLICY accounts_org_isolation ON public.accounts
            FOR ALL USING (auth_user_has_org_membership(organization_id) AND is_deleted = false)
            WITH CHECK (auth_user_has_org_membership(organization_id));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'contacts_org_isolation') THEN
        CREATE POLICY contacts_org_isolation ON public.contacts
            FOR ALL USING (auth_user_has_org_membership(organization_id) AND is_deleted = false)
            WITH CHECK (auth_user_has_org_membership(organization_id));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_org_isolation') THEN
        CREATE POLICY leads_org_isolation ON public.leads
            FOR ALL USING (auth_user_has_org_membership(organization_id) AND is_deleted = false)
            WITH CHECK (auth_user_has_org_membership(organization_id));
    END IF;
END $$;

-- Reload Supabase PostgREST schema cache
NOTIFY pgrst, 'reload schema';
