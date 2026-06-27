-- Quotes, CRM Pipeline, Jobs, and Calendar Booking tables for Skawk Trades

-- ============================================================
-- 1. RATE CARD (service price list per org)
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_card_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'each',          -- each, hour, metre, sqm, etc.
  price_min_cents INTEGER NOT NULL DEFAULT 0,
  price_max_cents INTEGER,                     -- NULL = fixed price (use min)
  category TEXT,                               -- plumbing, electrical, general, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_card_org ON rate_card_items(org_id, is_active);

-- ============================================================
-- 2. QUOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  deal_id UUID,                                -- FK added after deals table
  quote_number TEXT NOT NULL,                  -- human-readable QTE-0001
  status TEXT NOT NULL DEFAULT 'draft',        -- draft, sent, viewed, accepted, declined, expired
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  description TEXT,                            -- job summary
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ,
  notes TEXT,                                  -- internal notes
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_org ON quotes(org_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_contact ON quotes(contact_id);

CREATE TABLE IF NOT EXISTS quote_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  rate_card_item_id UUID REFERENCES rate_card_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'each',
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quote_lines ON quote_line_items(quote_id);

-- Quote number sequence per org
CREATE OR REPLACE FUNCTION next_quote_number(p_org_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO cnt FROM quotes WHERE org_id = p_org_id;
  RETURN 'QTE-' || LPAD(cnt::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- 3. CRM PIPELINE / DEALS
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'lead',          -- lead, qualified, quoted, booked, won, lost
  value_cents INTEGER,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  source TEXT DEFAULT 'inbound_call',          -- inbound_call, outbound_call, manual, website, referral
  notes TEXT,
  next_follow_up TIMESTAMPTZ,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_org_stage ON deals(org_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);

-- Now add FK from quotes to deals
ALTER TABLE quotes ADD CONSTRAINT fk_quotes_deal FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

-- ============================================================
-- 4. JOBS (post-quote lifecycle)
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  job_number TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked',       -- booked, in_progress, completed, invoiced, cancelled
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  scheduled_date DATE,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  notes TEXT,
  total_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_org ON jobs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_date ON jobs(org_id, scheduled_date);

-- Job number sequence per org
CREATE OR REPLACE FUNCTION next_job_number(p_org_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO cnt FROM jobs WHERE org_id = p_org_id;
  RETURN 'JOB-' || LPAD(cnt::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- 5. CALENDAR / BOOKING
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',     -- google, outlook, ical
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT,                            -- which calendar to write to
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, provider)
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  calendar_event_id TEXT,                      -- external calendar event ID
  sms_confirmed BOOLEAN NOT NULL DEFAULT false,
  sms_reminder_sent BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',    -- confirmed, cancelled, rescheduled, completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_org ON bookings(org_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(org_id, scheduled_start);

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================
ALTER TABLE rate_card_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Helper: check org membership (only create if not exists)
DO $$ BEGIN
  CREATE FUNCTION user_in_org(p_org_id UUID)
  RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $fn$
    SELECT EXISTS (
      SELECT 1 FROM org_members WHERE org_id = p_org_id AND user_id = auth.uid()
    );
  $fn$;
EXCEPTION WHEN duplicate_function THEN NULL;
END $$;

-- Rate card items
DROP POLICY IF EXISTS "rate_card_items_org" ON rate_card_items;
CREATE POLICY "rate_card_items_org" ON rate_card_items
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Quotes
DROP POLICY IF EXISTS "quotes_org" ON quotes;
CREATE POLICY "quotes_org" ON quotes
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Quote line items (via quote's org)
DROP POLICY IF EXISTS "quote_lines_org" ON quote_line_items;
CREATE POLICY "quote_lines_org" ON quote_line_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_id AND user_in_org(q.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_id AND user_in_org(q.org_id))
  );

-- Deals
DROP POLICY IF EXISTS "deals_org" ON deals;
CREATE POLICY "deals_org" ON deals
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Jobs
DROP POLICY IF EXISTS "jobs_org" ON jobs;
CREATE POLICY "jobs_org" ON jobs
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Calendar integrations
DROP POLICY IF EXISTS "calendar_int_org" ON calendar_integrations;
CREATE POLICY "calendar_int_org" ON calendar_integrations
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Bookings
DROP POLICY IF EXISTS "bookings_org" ON bookings;
CREATE POLICY "bookings_org" ON bookings
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));
