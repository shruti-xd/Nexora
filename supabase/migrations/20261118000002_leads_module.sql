-- =============================================================================
-- Migration: 20261118000002_leads_module.sql
-- Description: Core CRM Entities - Accounts, Contacts, Opportunities, Leads & Activities
-- Architecture: Multi-tenant, RLS-enforced, with atomic lead conversion procedure
-- =============================================================================

-- Step 1: Create Accounts table (B2B organizations & companies)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    website VARCHAR(255),
    city VARCHAR(100),
    annual_revenue NUMERIC(15, 2) DEFAULT 0,
    tier VARCHAR(50) DEFAULT 'Growth',
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_accounts_org_id ON accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_accounts_owner_id ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);

-- Step 2: Create Contacts table (Stakeholders and decision makers)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    title VARCHAR(150),
    is_decision_maker BOOLEAN NOT NULL DEFAULT false,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_account_id ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Step 3: Create Opportunities table (Deals and sales pipeline)
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    primary_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    stage VARCHAR(50) NOT NULL DEFAULT 'Qualification',
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    probability INTEGER NOT NULL DEFAULT 20,
    close_date DATE NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_opportunities_org_id ON opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_account_id ON opportunities(account_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);

-- Step 4: Create Leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255) NOT NULL,
    title VARCHAR(150),
    status VARCHAR(50) NOT NULL DEFAULT 'New',
    source VARCHAR(100) DEFAULT 'Direct',
    estimated_value NUMERIC(12, 2) DEFAULT 0,
    lead_score INTEGER DEFAULT 0,
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    converted_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    converted_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    converted_opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_lead_status CHECK (status IN ('New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'))
);

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Step 5: Create Activities table (Polymorphic timeline for tasks, calls, meetings)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    related_type VARCHAR(50) NOT NULL,
    related_id UUID NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date DATE,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_activity_type CHECK (type IN ('Task', 'Call', 'Meeting', 'Email', 'Note')),
    CONSTRAINT chk_activity_related_type CHECK (related_type IN ('Lead', 'Account', 'Contact', 'Opportunity'))
);

DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_activities_org_id ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_related ON activities(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON activities(owner_id);

-- Step 6: Enable Row Level Security (RLS) on all CRM tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Helper policy definitions: Org members can access data in their active organization
DROP POLICY IF EXISTS "org_members_accounts_all" ON accounts;
CREATE POLICY "org_members_accounts_all" ON accounts
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "org_members_contacts_all" ON contacts;
CREATE POLICY "org_members_contacts_all" ON contacts
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "org_members_opportunities_all" ON opportunities;
CREATE POLICY "org_members_opportunities_all" ON opportunities
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "org_members_leads_all" ON leads;
CREATE POLICY "org_members_leads_all" ON leads
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

DROP POLICY IF EXISTS "org_members_activities_all" ON activities;
CREATE POLICY "org_members_activities_all" ON activities
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Step 7: Atomic Lead Conversion Stored Procedure
CREATE OR REPLACE FUNCTION convert_lead(
    p_lead_id UUID,
    p_user_id UUID,
    p_create_opportunity BOOLEAN DEFAULT true,
    p_opp_name VARCHAR DEFAULT NULL,
    p_opp_amount NUMERIC DEFAULT NULL,
    p_existing_account_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lead RECORD;
    v_account_id UUID;
    v_contact_id UUID;
    v_opp_id UUID := NULL;
    v_result JSONB;
BEGIN
    -- 1. Lock and retrieve lead record
    SELECT * INTO v_lead
    FROM leads
    WHERE id = p_lead_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found with id %', p_lead_id;
    END IF;

    IF v_lead.status = 'Converted' THEN
        RAISE EXCEPTION 'Lead has already been converted';
    END IF;

    -- 2. Resolve or create Account
    IF p_existing_account_id IS NOT NULL THEN
        -- Verify existing account belongs to same organization
        SELECT id INTO v_account_id
        FROM accounts
        WHERE id = p_existing_account_id AND organization_id = v_lead.organization_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Specified account not found in current organization';
        END IF;
    ELSE
        INSERT INTO accounts (
            organization_id,
            name,
            owner_id,
            created_at,
            updated_at
        ) VALUES (
            v_lead.organization_id,
            v_lead.company,
            p_user_id,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_account_id;
    END IF;

    -- 3. Create Contact linked to Account
    INSERT INTO contacts (
        organization_id,
        account_id,
        first_name,
        last_name,
        email,
        phone,
        title,
        owner_id,
        is_decision_maker,
        created_at,
        updated_at
    ) VALUES (
        v_lead.organization_id,
        v_account_id,
        v_lead.first_name,
        v_lead.last_name,
        v_lead.email,
        v_lead.phone,
        v_lead.title,
        p_user_id,
        true,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_contact_id;

    -- 4. Optionally create Opportunity
    IF p_create_opportunity IS TRUE THEN
        INSERT INTO opportunities (
            organization_id,
            account_id,
            primary_contact_id,
            name,
            amount,
            stage,
            probability,
            close_date,
            owner_id,
            created_at,
            updated_at
        ) VALUES (
            v_lead.organization_id,
            v_account_id,
            v_contact_id,
            COALESCE(p_opp_name, v_lead.company || ' — Opportunity'),
            COALESCE(p_opp_amount, v_lead.estimated_value, 0),
            'Qualification',
            20,
            CURRENT_DATE + INTERVAL '30 days',
            p_user_id,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_opp_id;
    END IF;

    -- 5. Update Lead status to Converted
    UPDATE leads
    SET status = 'Converted',
        converted_at = NOW(),
        converted_account_id = v_account_id,
        converted_contact_id = v_contact_id,
        converted_opportunity_id = v_opp_id,
        updated_at = NOW()
    WHERE id = p_lead_id;

    -- 6. Record audit log
    INSERT INTO audit_logs (
        organization_id,
        user_id,
        action,
        resource,
        resource_id,
        metadata
    ) VALUES (
        v_lead.organization_id,
        p_user_id,
        'LEAD_CONVERTED',
        'leads',
        p_lead_id::text,
        jsonb_build_object(
            'account_id', v_account_id,
            'contact_id', v_contact_id,
            'opportunity_id', v_opp_id,
            'lead_company', v_lead.company
        )
    );

    -- 7. Build result envelope
    v_result := jsonb_build_object(
        'lead_id', p_lead_id,
        'account_id', v_account_id,
        'contact_id', v_contact_id,
        'opportunity_id', v_opp_id
    );

    RETURN v_result;
END;
$$;
