-- TradeCall moat features: customer memory, invoices, payments, overflow network,
-- trade AI, smart pricing, public booking pages, area intelligence

-- ============================================================
-- 1. CUSTOMER PROFILES (persistent memory across calls)
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  address TEXT,
  suburb TEXT,
  postcode TEXT,
  property_type TEXT,                          -- house, unit, townhouse, commercial
  notes TEXT,                                  -- AI-accumulated notes from calls
  total_jobs INTEGER NOT NULL DEFAULT 0,
  total_spent_cents INTEGER NOT NULL DEFAULT 0,
  first_contact_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_contact_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tags TEXT[],                                 -- vip, regular, slow-payer, etc
  metadata JSONB DEFAULT '{}'::jsonb,          -- flexible storage for AI-learned facts
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_org ON customer_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone ON customer_profiles(org_id, phone);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_suburb ON customer_profiles(org_id, suburb);

-- ============================================================
-- 2. INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',        -- draft, sent, viewed, paid, overdue, cancelled
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  description TEXT,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  stripe_payment_link TEXT,
  payment_method TEXT,                         -- card, bank_transfer, cash
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(org_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_job ON invoices(job_id);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'each',
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines ON invoice_line_items(invoice_id);

-- Invoice number sequence
CREATE OR REPLACE FUNCTION next_invoice_number(p_org_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE cnt INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO cnt FROM invoices WHERE org_id = p_org_id;
  RETURN 'INV-' || LPAD(cnt::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- 3. JOB OVERFLOW NETWORK
-- ============================================================

-- Tradie availability and service area
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trade_type TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS service_suburbs TEXT[];
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 25;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS accepts_overflow BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS overflow_fee_pct INTEGER DEFAULT 10;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_jobs_per_day INTEGER DEFAULT 8;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Overflow job offers
CREATE TABLE IF NOT EXISTS overflow_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  customer_suburb TEXT,
  job_description TEXT,
  estimated_value_cents INTEGER,
  urgency TEXT DEFAULT 'normal',               -- urgent, normal, flexible
  status TEXT NOT NULL DEFAULT 'pending',       -- pending, offered, accepted, declined, completed, expired
  referral_fee_cents INTEGER DEFAULT 0,
  offered_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_overflow_source ON overflow_jobs(source_org_id, status);
CREATE INDEX IF NOT EXISTS idx_overflow_target ON overflow_jobs(target_org_id, status);

-- Overflow earnings tracking
CREATE TABLE IF NOT EXISTS overflow_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overflow_job_id UUID NOT NULL REFERENCES overflow_jobs(id) ON DELETE CASCADE,
  source_org_id UUID NOT NULL REFERENCES organizations(id),
  target_org_id UUID NOT NULL REFERENCES organizations(id),
  job_value_cents INTEGER NOT NULL DEFAULT 0,
  fee_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',       -- pending, paid, cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. TRADE-SPECIFIC AI PROMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS trade_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_type TEXT NOT NULL,                    -- plumber, electrician, builder, etc
  prompt_type TEXT NOT NULL,                   -- inbound_greeting, qualification, quoting, follow_up, review_request
  prompt_text TEXT NOT NULL,
  qualifying_questions TEXT[],                 -- trade-specific questions to ask
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trade_type, prompt_type, is_default)
);

-- Org-specific prompt overrides
CREATE TABLE IF NOT EXISTS org_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  qualifying_questions TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, prompt_type)
);

-- ============================================================
-- 5. SMART PRICING / PRICE INTELLIGENCE
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  quoted_cents INTEGER NOT NULL,
  actual_cents INTEGER,                        -- what was actually charged
  suburb TEXT,
  postcode TEXT,
  accepted BOOLEAN,                            -- was the quote accepted?
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_org ON price_history(org_id, service_name);
CREATE INDEX IF NOT EXISTS idx_price_history_area ON price_history(suburb, service_name);

-- Aggregated area pricing (materialized by cron)
CREATE TABLE IF NOT EXISTS area_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  suburb TEXT,
  postcode TEXT,
  avg_price_cents INTEGER NOT NULL DEFAULT 0,
  min_price_cents INTEGER NOT NULL DEFAULT 0,
  max_price_cents INTEGER NOT NULL DEFAULT 0,
  sample_count INTEGER NOT NULL DEFAULT 0,
  acceptance_rate NUMERIC(5,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trade_type, service_name, postcode)
);

-- ============================================================
-- 6. PUBLIC BOOKING PAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,                   -- public URL slug
  is_active BOOLEAN NOT NULL DEFAULT true,
  headline TEXT,
  description TEXT,
  accent_color TEXT DEFAULT '#2563eb',
  show_prices BOOLEAN NOT NULL DEFAULT true,
  show_reviews BOOLEAN NOT NULL DEFAULT true,
  availability_hours JSONB,                    -- {"mon": {"start": "07:00", "end": "17:00"}, ...}
  max_advance_days INTEGER DEFAULT 30,
  min_notice_hours INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);

-- Public booking requests (from the booking page)
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_page_id UUID NOT NULL REFERENCES booking_pages(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  service_requested TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  urgency TEXT DEFAULT 'normal',
  description TEXT,
  estimated_value_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'new',           -- new, contacted, booked, declined
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_org ON booking_requests(org_id, status);

-- ============================================================
-- 7. CUSTOMER REVIEWS (for booking page display)
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  customer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  job_type TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  source TEXT DEFAULT 'tradecall',             -- tradecall, google, imported
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_org ON customer_reviews(org_id, is_public);

-- ============================================================
-- 8. SENTIMENT / FOLLOW-UP INTELLIGENCE
-- ============================================================
CREATE TABLE IF NOT EXISTS call_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  customer_phone TEXT NOT NULL,
  sentiment TEXT NOT NULL,                     -- eager, interested, hesitant, price_shopping, not_interested
  urgency TEXT NOT NULL DEFAULT 'normal',      -- emergency, urgent, normal, flexible
  follow_up_action TEXT,                       -- call_back_2h, call_back_24h, send_quote, no_action
  follow_up_at TIMESTAMPTZ,
  follow_up_done BOOLEAN NOT NULL DEFAULT false,
  key_objections TEXT[],                       -- price, timing, trust, already_booked
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sentiment_org ON call_sentiment(org_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_followup ON call_sentiment(follow_up_at, follow_up_done);

-- ============================================================
-- 9. AREA INTELLIGENCE
-- ============================================================
CREATE TABLE IF NOT EXISTS area_demand (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_type TEXT NOT NULL,
  suburb TEXT NOT NULL,
  postcode TEXT,
  period TEXT NOT NULL,                        -- 2026-W14, 2026-03, etc
  call_count INTEGER NOT NULL DEFAULT 0,
  job_count INTEGER NOT NULL DEFAULT 0,
  avg_value_cents INTEGER DEFAULT 0,
  top_services TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trade_type, suburb, period)
);

-- ============================================================
-- 10. RLS POLICIES
-- ============================================================
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE overflow_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE overflow_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sentiment ENABLE ROW LEVEL SECURITY;

-- Customer profiles
DROP POLICY IF EXISTS "customer_profiles_org" ON customer_profiles;
CREATE POLICY "customer_profiles_org" ON customer_profiles
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Invoices
DROP POLICY IF EXISTS "invoices_org" ON invoices;
CREATE POLICY "invoices_org" ON invoices
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Invoice line items
DROP POLICY IF EXISTS "invoice_lines_org" ON invoice_line_items;
CREATE POLICY "invoice_lines_org" ON invoice_line_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND user_in_org(i.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND user_in_org(i.org_id))
  );

-- Overflow jobs (visible to source and target orgs)
DROP POLICY IF EXISTS "overflow_jobs_org" ON overflow_jobs;
CREATE POLICY "overflow_jobs_org" ON overflow_jobs
  FOR ALL USING (user_in_org(source_org_id) OR user_in_org(target_org_id))
  WITH CHECK (user_in_org(source_org_id));

-- Overflow earnings
DROP POLICY IF EXISTS "overflow_earnings_org" ON overflow_earnings;
CREATE POLICY "overflow_earnings_org" ON overflow_earnings
  FOR ALL USING (user_in_org(source_org_id) OR user_in_org(target_org_id));

-- Trade prompts (public read)
DROP POLICY IF EXISTS "trade_prompts_read" ON trade_prompts;
CREATE POLICY "trade_prompts_read" ON trade_prompts FOR SELECT USING (true);

-- Org prompts
DROP POLICY IF EXISTS "org_prompts_org" ON org_prompts;
CREATE POLICY "org_prompts_org" ON org_prompts
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Price history
DROP POLICY IF EXISTS "price_history_org" ON price_history;
CREATE POLICY "price_history_org" ON price_history
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Area pricing (public read for benchmarking)
ALTER TABLE area_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "area_pricing_read" ON area_pricing;
CREATE POLICY "area_pricing_read" ON area_pricing FOR SELECT USING (true);

-- Booking pages
DROP POLICY IF EXISTS "booking_pages_org" ON booking_pages;
CREATE POLICY "booking_pages_org" ON booking_pages
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Booking pages public read for the public booking page
DROP POLICY IF EXISTS "booking_pages_public" ON booking_pages;
CREATE POLICY "booking_pages_public" ON booking_pages
  FOR SELECT USING (is_active = true);

-- Booking requests
DROP POLICY IF EXISTS "booking_requests_org" ON booking_requests;
CREATE POLICY "booking_requests_org" ON booking_requests
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Booking requests public insert (customers can submit)
DROP POLICY IF EXISTS "booking_requests_insert" ON booking_requests;
CREATE POLICY "booking_requests_insert" ON booking_requests
  FOR INSERT WITH CHECK (true);

-- Customer reviews
DROP POLICY IF EXISTS "reviews_org" ON customer_reviews;
CREATE POLICY "reviews_org" ON customer_reviews
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Reviews public read
DROP POLICY IF EXISTS "reviews_public" ON customer_reviews;
CREATE POLICY "reviews_public" ON customer_reviews
  FOR SELECT USING (is_public = true);

-- Call sentiment
DROP POLICY IF EXISTS "sentiment_org" ON call_sentiment;
CREATE POLICY "sentiment_org" ON call_sentiment
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

-- Area demand (public read)
ALTER TABLE area_demand ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "area_demand_read" ON area_demand;
CREATE POLICY "area_demand_read" ON area_demand FOR SELECT USING (true);

-- ============================================================
-- 11. SEED DEFAULT TRADE PROMPTS
-- ============================================================
INSERT INTO trade_prompts (trade_type, prompt_type, prompt_text, qualifying_questions) VALUES
('plumber', 'inbound_greeting',
 'You are answering the phone for {business_name}, a local plumbing business. Be friendly, professional, and Australian. Introduce yourself and ask how you can help today.',
 ARRAY['Is it an emergency or can it wait?', 'Is it sewage or stormwater?', 'Is it a house, unit, or commercial property?', 'What suburb are you in?', 'When would suit you for a visit?']),
('plumber', 'qualification',
 'You need to qualify this plumbing job. Ask about the issue, urgency, property type, and location. If it sounds like an emergency (burst pipe, flooding, no hot water in winter), flag it as urgent.',
 ARRAY['Can you describe the issue?', 'How long has it been happening?', 'Is there any water damage?', 'Do you own or rent the property?', 'Is the water currently turned off?']),
('electrician', 'inbound_greeting',
 'You are answering the phone for {business_name}, a local electrical business. Be friendly and professional. Ask how you can help.',
 ARRAY['Is this an emergency?', 'Is your switchboard ceramic or plastic?', 'How old is the property?', 'What suburb are you in?', 'When would suit you?']),
('electrician', 'qualification',
 'Qualify this electrical job. Ask about the issue, safety concerns, and property details. If they mention sparking, burning smell, or no power, flag as urgent.',
 ARRAY['Can you describe the electrical issue?', 'Are there any safety concerns like sparking or burning smells?', 'Is this a residential or commercial property?', 'Do you have a switchboard or fuse box?', 'Have you checked the circuit breakers?']),
('builder', 'inbound_greeting',
 'You are answering the phone for {business_name}, a local building company. Be professional and ask about their project.',
 ARRAY['What type of project is this?', 'Do you have council approval?', 'What is your approximate budget?', 'What suburb is the property in?', 'When are you looking to start?']),
('builder', 'qualification',
 'Qualify this building job. Understand the scope, timeline, budget, and whether they have plans/permits.',
 ARRAY['Is this a new build, renovation, or repair?', 'Do you have architectural plans?', 'Have you spoken to council about permits?', 'What is your approximate budget range?', 'When do you need the work completed by?']),
('default', 'inbound_greeting',
 'You are answering the phone for {business_name}. Be friendly, professional, and Australian. Ask how you can help today.',
 ARRAY['What do you need help with?', 'How urgent is this?', 'What is your address?', 'When would suit you for a visit?']),
('default', 'qualification',
 'Qualify this job request. Understand what they need, how urgent it is, where they are, and when they want it done.',
 ARRAY['Can you describe what you need done?', 'How urgent is this?', 'Is this a residential or commercial property?', 'What suburb are you in?', 'Do you have a budget in mind?']),
('default', 'follow_up',
 'You are calling back {customer_name} on behalf of {business_name}. They called earlier about {job_description}. Check if they still need help and offer to book a time.',
 ARRAY['Are you still looking to get this sorted?', 'Would you like me to book a time for you?', 'Do you have any questions about pricing?']),
('default', 'review_request',
 'You are texting {customer_name} on behalf of {business_name}. Thank them for choosing you and ask for a Google review.',
 '{}'::TEXT[])
ON CONFLICT DO NOTHING;
