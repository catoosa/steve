-- Fix infinite recursion in org_members RLS policies.
-- Both members_select (via user_in_org) and members_manage (direct self-join)
-- query org_members from within its own RLS policies, causing infinite recursion.
--
-- Fix: SELECT uses direct auth.uid() check (no self-reference).
-- Manage ops (INSERT/UPDATE/DELETE) use a SECURITY DEFINER function to bypass RLS.

DROP POLICY IF EXISTS "members_select" ON org_members;
CREATE POLICY "members_select" ON org_members
  FOR SELECT USING (user_id = auth.uid());

-- Replace the FOR ALL manage policy with separate non-recursive policies
DROP POLICY IF EXISTS "members_manage" ON org_members;

-- SECURITY DEFINER function to check org admin/owner without triggering RLS
CREATE OR REPLACE FUNCTION is_org_admin(p_org_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  );
$$;

CREATE POLICY "members_insert" ON org_members
  FOR INSERT WITH CHECK (is_org_admin(org_id));

CREATE POLICY "members_update" ON org_members
  FOR UPDATE USING (is_org_admin(org_id));

CREATE POLICY "members_delete" ON org_members
  FOR DELETE USING (is_org_admin(org_id));
