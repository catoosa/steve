CREATE TABLE IF NOT EXISTS org_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON org_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON org_invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON org_invitations(email);

-- RLS
ALTER TABLE org_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org admins can manage invitations" ON org_invitations;
CREATE POLICY "Org admins can manage invitations" ON org_invitations
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Allow unauthenticated lookup by token (for accept-invite page)
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON org_invitations;
CREATE POLICY "Anyone can read invitation by token" ON org_invitations
  FOR SELECT USING (true);
