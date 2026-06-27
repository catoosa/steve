-- Add Twilio number tracking for tradee.io phone provisioning
-- (Bland AI only sells US numbers; AU numbers come from Twilio)

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS twilio_number_sid TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone_provider TEXT;
