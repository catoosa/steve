-- =============================================================================
-- Steve — AI Voice Calling as a Service
-- Multi-tenant schema
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ORGANIZATIONS (tenants)
-- =============================================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  call_balance INTEGER NOT NULL DEFAULT 50, -- free tier starts with 50 calls
  monthly_call_limit INTEGER NOT NULL DEFAULT 50,
  api_key TEXT UNIQUE DEFAULT 'sk_' || replace(gen_random_uuid()::text, '-', ''),
  webhook_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orgs_owner ON organizations(owner_id);
CREATE INDEX idx_orgs_api_key ON organizations(api_key);
CREATE INDEX idx_orgs_slug ON organizations(slug);

-- =============================================================================
-- ORG MEMBERS
-- =============================================================================
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_org_members_org ON org_members(org_id);

-- =============================================================================
-- CAMPAIGNS
-- =============================================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),

  -- Voice agent config
  agent_name TEXT NOT NULL DEFAULT 'Steve',
  agent_prompt TEXT NOT NULL,
  first_sentence TEXT,
  analysis_prompt TEXT,
  voice TEXT NOT NULL DEFAULT 'mason',
  language TEXT NOT NULL DEFAULT 'en-AU',
  max_duration INTEGER NOT NULL DEFAULT 120,

  -- Scheduling
  schedule_start TIMESTAMPTZ,
  schedule_end TIMESTAMPTZ,
  calling_hours_start TIME DEFAULT '09:00',
  calling_hours_end TIME DEFAULT '17:00',
  timezone TEXT DEFAULT 'Australia/Sydney',

  -- Stats (denormalized for speed)
  total_contacts INTEGER NOT NULL DEFAULT 0,
  calls_completed INTEGER NOT NULL DEFAULT 0,
  calls_answered INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_org ON campaigns(org_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- =============================================================================
-- CONTACTS
-- =============================================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'calling', 'completed', 'failed', 'skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_campaign ON contacts(campaign_id);
CREATE INDEX idx_contacts_status ON contacts(campaign_id, status);
CREATE INDEX idx_contacts_org ON contacts(org_id);

-- =============================================================================
-- CALLS
-- =============================================================================
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Bland AI fields
  bland_call_id TEXT,
  bland_batch_id TEXT,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'in_progress', 'completed', 'no_answer', 'voicemail', 'busy', 'failed')),
  answered_by TEXT, -- 'human', 'voicemail', 'unknown'
  duration_seconds INTEGER,

  -- Results
  transcript TEXT,
  analysis JSONB,
  recording_url TEXT,
  cost_cents INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calls_org ON calls(org_id);
CREATE INDEX idx_calls_campaign ON calls(campaign_id);
CREATE INDEX idx_calls_contact ON calls(contact_id);
CREATE INDEX idx_calls_bland ON calls(bland_call_id);
CREATE INDEX idx_calls_status ON calls(org_id, status);

-- =============================================================================
-- USAGE / BILLING
-- =============================================================================
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calls_made INTEGER NOT NULL DEFAULT 0,
  calls_answered INTEGER NOT NULL DEFAULT 0,
  total_duration_seconds INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, period_start)
);

CREATE INDEX idx_usage_org ON usage_records(org_id, period_start);

-- =============================================================================
-- API LOGS
-- =============================================================================
CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_logs_org ON api_logs(org_id, created_at DESC);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is member of org
CREATE OR REPLACE FUNCTION user_in_org(org UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members WHERE org_id = org AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: members can read, owner can update
CREATE POLICY "org_select" ON organizations FOR SELECT USING (user_in_org(id));
CREATE POLICY "org_update" ON organizations FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "org_insert" ON organizations FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Org members: members can read
CREATE POLICY "members_select" ON org_members FOR SELECT USING (user_in_org(org_id));
CREATE POLICY "members_manage" ON org_members FOR ALL USING (
  EXISTS (SELECT 1 FROM org_members WHERE org_id = org_members.org_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Campaigns: org members
CREATE POLICY "campaigns_select" ON campaigns FOR SELECT USING (user_in_org(org_id));
CREATE POLICY "campaigns_manage" ON campaigns FOR ALL USING (user_in_org(org_id));

-- Contacts: org members
CREATE POLICY "contacts_select" ON contacts FOR SELECT USING (user_in_org(org_id));
CREATE POLICY "contacts_manage" ON contacts FOR ALL USING (user_in_org(org_id));

-- Calls: org members
CREATE POLICY "calls_select" ON calls FOR SELECT USING (user_in_org(org_id));
CREATE POLICY "calls_manage" ON calls FOR ALL USING (user_in_org(org_id));

-- Usage: org members
CREATE POLICY "usage_select" ON usage_records FOR SELECT USING (user_in_org(org_id));

-- API logs: org members
CREATE POLICY "api_logs_select" ON api_logs FOR SELECT USING (user_in_org(org_id));

-- =============================================================================
-- TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_orgs_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_campaigns_updated BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-add owner as org member on insert
CREATE OR REPLACE FUNCTION add_owner_as_member() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO org_members (org_id, user_id, role) VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_org_owner AFTER INSERT ON organizations FOR EACH ROW EXECUTE FUNCTION add_owner_as_member();
