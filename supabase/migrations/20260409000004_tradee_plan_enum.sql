-- Update organizations.plan check constraint to include Tradee plan IDs
-- Existing Skawk plans still allowed: free, starter, pro, agency, enterprise, expired
-- New Tradee plans added: tradie, boss

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;

ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN (
    'free', 'starter', 'pro', 'agency', 'enterprise', 'expired',
    'tradie', 'boss'
  ));
