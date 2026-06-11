-- Drop existing status check constraint and add new allowed statuses
DO $$ 
BEGIN
    ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
    
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'paid', 'pending_signature', 'signed_pending_payment'));
END $$;
