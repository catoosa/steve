-- Early access signup tracking for tradee.io pre-release
CREATE TABLE IF NOT EXISTS early_access_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  trade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow service role full access (no RLS needed — only server-side inserts)
ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;
