-- Atomic balance reservation functions
-- Prevents race conditions when multiple calls check balance simultaneously

-- Reserve balance atomically: decrements by p_count only if sufficient balance exists.
-- Returns TRUE if reservation succeeded, FALSE if insufficient balance.
CREATE OR REPLACE FUNCTION reserve_call_balance(p_org_id UUID, p_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE organizations
  SET call_balance = call_balance - p_count
  WHERE id = p_org_id
    AND call_balance >= p_count;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release reserved balance back to the org (e.g. when a Bland API call fails).
CREATE OR REPLACE FUNCTION release_call_balance(p_org_id UUID, p_count INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE organizations
  SET call_balance = call_balance + p_count
  WHERE id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
