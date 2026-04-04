CREATE TABLE IF NOT EXISTS dnc_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  reason TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'upload', 'opt_out', 'do_not_call_register')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, phone)
);
CREATE INDEX IF NOT EXISTS idx_dnc_org_phone ON dnc_numbers(org_id, phone);
ALTER TABLE dnc_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage DNC" ON dnc_numbers
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
