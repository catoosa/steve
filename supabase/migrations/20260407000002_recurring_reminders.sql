-- Recurring job reminders and outbound marketing campaigns for trades

-- ============================================================
-- 1. RECURRING REMINDERS (annual services, maintenance etc)
-- ============================================================
CREATE TABLE IF NOT EXISTS recurring_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,                          -- "Annual gas safety check"
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  frequency_months INTEGER NOT NULL DEFAULT 12, -- 3, 6, 12
  last_completed DATE,
  next_due DATE NOT NULL,
  call_prompt TEXT,                             -- custom AI script for the reminder call
  sms_message TEXT,                             -- custom SMS for the reminder
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_call BOOLEAN NOT NULL DEFAULT true,      -- auto-call when due
  auto_sms BOOLEAN NOT NULL DEFAULT true,       -- auto-SMS when due
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_org ON recurring_reminders(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON recurring_reminders(next_due, is_active);

-- ============================================================
-- 2. MARKETING CAMPAIGNS (simplified for trades)
-- ============================================================
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template TEXT NOT NULL,                       -- template key: win_back, seasonal, review_request, maintenance_reminder
  status TEXT NOT NULL DEFAULT 'draft',         -- draft, active, paused, completed
  channel TEXT NOT NULL DEFAULT 'sms',          -- sms, call, both
  message TEXT,                                 -- SMS message template
  call_prompt TEXT,                             -- AI call script
  target_filter JSONB,                          -- filter criteria for contacts
  total_contacts INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  responded_count INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mktg_campaigns_org ON marketing_campaigns(org_id, status);

CREATE TABLE IF NOT EXISTS marketing_campaign_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',       -- pending, sent, delivered, responded, failed, opted_out
  sent_at TIMESTAMPTZ,
  response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mktg_contacts ON marketing_campaign_contacts(campaign_id, status);

-- ============================================================
-- 3. RLS
-- ============================================================
ALTER TABLE recurring_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaign_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reminders_org" ON recurring_reminders;
CREATE POLICY "reminders_org" ON recurring_reminders
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

DROP POLICY IF EXISTS "mktg_campaigns_org" ON marketing_campaigns;
CREATE POLICY "mktg_campaigns_org" ON marketing_campaigns
  FOR ALL USING (user_in_org(org_id)) WITH CHECK (user_in_org(org_id));

DROP POLICY IF EXISTS "mktg_contacts_org" ON marketing_campaign_contacts;
CREATE POLICY "mktg_contacts_org" ON marketing_campaign_contacts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM marketing_campaigns mc WHERE mc.id = campaign_id AND user_in_org(mc.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM marketing_campaigns mc WHERE mc.id = campaign_id AND user_in_org(mc.org_id))
  );
