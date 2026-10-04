CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  property_name TEXT NOT NULL,
  room_id TEXT NOT NULL,
  room_name TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 12),
  currency TEXT NOT NULL DEFAULT 'INR',
  amount_per_night INTEGER NOT NULL CHECK (amount_per_night >= 0),
  taxes_and_fees INTEGER NOT NULL CHECK (taxes_and_fees >= 0),
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status = 'confirmed'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS bookings_tenant_created_idx
  ON bookings (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_journey_events (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('property_viewed', 'booking_started')),
  property_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_journey_events_type_tenant_idx
  ON user_journey_events (event_type, tenant_id);
