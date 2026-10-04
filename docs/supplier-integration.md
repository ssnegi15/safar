# Supplier integration

## Current provider

`InternalSyntheticTravelProvider` supplies generated public accommodation and destination data. Its records are marked synthetic, and the UI labels the demo inventory. No live supplier integration or booking handoff is present.

## Stable provider ports

Keep the canonical application model independent of supplier payloads. The initial `AccommodationProvider` supports property search, property details, and an availability/rate snapshot. Add separate `FlightProvider`, `RailProvider`, `ActivityProvider`, and `DestinationProvider` ports only as those vertical slices arrive.

Each adapter maps its source schema into canonical domain types and must expose provider failures explicitly. Use bounded timeouts and safe retry only for idempotent calls; add circuit breaking only if multiple providers/observed failure rates justify the complexity. Treat prices and availability as short-lived snapshots, not catalog truth.

There is no Booking.com or Agoda integration, dependency, or scraping. Future suppliers can implement the ports without requiring browser/domain rewrites. Deterministic synthetic data remains clearly distinguishable from real supplier inventory and user-generated reviews.
