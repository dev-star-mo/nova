-- Remove Zoho-specific fields from the bookings table now that BoldSign is used.
ALTER TABLE bookings
  DROP COLUMN IF EXISTS zoho_request_id,
  DROP COLUMN IF EXISTS zoho_action_id,
  DROP COLUMN IF EXISTS zoho_status,
  DROP COLUMN IF EXISTS zoho_payload;
