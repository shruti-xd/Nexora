CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    phone VARCHAR(255),
    industry VARCHAR(255),
    annual_revenue NUMERIC DEFAULT 0,
    employee_count INTEGER,
    billing_address TEXT,
    city VARCHAR(255),
    tier VARCHAR(255) DEFAULT 'Growth',
    owner_id UUID,
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS employee_count INTEGER;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS billing_address TEXT;

DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.accounts TO authenticated;
GRANT SELECT ON TABLE public.accounts TO anon;

DROP POLICY IF EXISTS "Authenticated users can view accounts" ON public.accounts;
CREATE POLICY "Authenticated users can view accounts"
    ON public.accounts FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can create accounts" ON public.accounts;
CREATE POLICY "Authenticated users can create accounts"
    ON public.accounts FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update accounts" ON public.accounts;
CREATE POLICY "Authenticated users can update accounts"
    ON public.accounts FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete accounts" ON public.accounts;
CREATE POLICY "Authenticated users can delete accounts"
    ON public.accounts FOR DELETE
    TO authenticated
    USING (true);
