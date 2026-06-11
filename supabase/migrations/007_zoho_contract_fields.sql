-- Add Zoho contract tracking fields to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS contract_signed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zoho_request_id TEXT,
  ADD COLUMN IF NOT EXISTS zoho_payload JSONB;
