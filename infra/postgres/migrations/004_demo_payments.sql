CREATE TABLE IF NOT EXISTS demo_payments (
  id UUID PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('demo_card', 'demo_upi')),
  status TEXT NOT NULL CHECK (status = 'demo_succeeded'),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  demo_reference TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
