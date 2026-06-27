-- Add subscription, trial, voice cloning, and phone number fields for tradee.io

-- Trial and plan status tracking
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'trialing';
-- plan_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'

-- Stripe subscription tracking (in addition to existing stripe_subscription_id)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Tradee phone number assigned to this org
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS assigned_phone_number TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS bland_inbound_number_id TEXT;

-- Voice cloning
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS voice_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS voice_name TEXT;

-- Index for fast number lookup on inbound webhooks
CREATE INDEX IF NOT EXISTS idx_organizations_assigned_phone ON organizations(assigned_phone_number);
