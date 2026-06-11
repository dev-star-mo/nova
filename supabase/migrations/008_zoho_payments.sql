-- Add Zoho and payment fields to bookings table
BEGIN;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS zoho_request_id text,
  ADD COLUMN IF NOT EXISTS zoho_action_id text,
  ADD COLUMN IF NOT EXISTS zoho_status text,
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS payment_link text,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

COMMIT;
