-- =============================================================================
-- Agency sub-account management
-- =============================================================================

-- Sub-account relationship: agency org → client org
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS parent_org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS is_agency BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sub_account_limit INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orgs_parent ON organizations(parent_org_id);

-- Agency plan: drop existing check constraint and recreate with 'agency' included
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'enterprise', 'expired'));

-- RLS: allow agency owners to read their sub-accounts
-- (sub-accounts are orgs whose parent_org_id = the agency's org id)
-- The existing org_select policy uses user_in_org(id); we add a supplementary policy
-- so agency owners can SELECT their sub-account orgs even if not directly a member.
CREATE POLICY "agency_sub_select" ON organizations
  FOR SELECT
  USING (
    parent_org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = parent_org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );
