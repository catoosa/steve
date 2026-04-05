-- Budget controls: per-campaign spend limits
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget_limit_cents INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS spend_cents INTEGER NOT NULL DEFAULT 0;

-- Phone validation status on contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone_valid BOOLEAN;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone_type TEXT; -- mobile, landline, voip, unknown

CREATE INDEX IF NOT EXISTS idx_contacts_phone_valid ON contacts(campaign_id, phone_valid);
