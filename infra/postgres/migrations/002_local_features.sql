CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants (id),
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date),
  UNIQUE (id, tenant_id)
);

CREATE INDEX IF NOT EXISTS trips_tenant_dates_idx
  ON trips (tenant_id, start_date, end_date);

CREATE TABLE IF NOT EXISTS itinerary_events (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants (id),
  trip_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('activity', 'flight', 'train', 'hotel', 'transfer', 'other')
  ),
  title TEXT NOT NULL,
  location TEXT,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at),
  FOREIGN KEY (trip_id, tenant_id) REFERENCES trips (id, tenant_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS itinerary_events_tenant_trip_time_idx
  ON itinerary_events (tenant_id, trip_id, start_at);

CREATE TABLE IF NOT EXISTS favorites (
  tenant_id TEXT NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, property_id)
);
