ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_orgs_custom_domain ON organizations(custom_domain);
