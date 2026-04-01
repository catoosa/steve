-- RPC functions for atomic counter updates

-- Increment campaign stats
CREATE OR REPLACE FUNCTION increment_campaign_stats(
  p_campaign_id UUID,
  p_completed INTEGER DEFAULT 0,
  p_answered INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  UPDATE campaigns
  SET
    calls_completed = calls_completed + p_completed,
    calls_answered = calls_answered + p_answered
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement org call balance (min 0)
CREATE OR REPLACE FUNCTION decrement_call_balance(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE organizations
  SET call_balance = GREATEST(call_balance - 1, 0)
  WHERE id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
