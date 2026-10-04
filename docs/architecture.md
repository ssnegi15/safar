# Architecture

## Product and current scope

Safar is a multi-tenant consumer travel platform, beginning with Indian travel discovery. V1 uses a modular monolith and synthetic suppliers. AI/LLM itinerary generation is explicitly out of scope.

The first delivered vertical slice is public destination/property discovery. The current implementation uses deterministic in-process catalog/rate data; it does not yet persist data or offer booking. Private trip or document endpoints must not be added until authentication and tenant authorization are in place.

## Target repository boundaries

```text
apps/
  web/       React consumer application
  api/       NestJS REST modular monolith
  worker/    asynchronous processing, when a real queue-backed workflow exists
packages/
  contracts/ shared API contracts, after the API contract is generated/stabilized
  domain/    canonical travel entities and domain rules
  search/    search port and provider-neutral query/results
  providers/ external-service adapters, when multiple consumers need them
infra/
  floci/     current local Azure-compatible emulator
  compose/   Docker Compose development environment, to be completed before production work
docs/
```

The current tree intentionally starts smaller: only `apps/web`, `apps/api`, and `infra/floci` exist. Packages are introduced when they have multiple real consumers rather than as empty placeholders.

## Runtime dependency direction

```text
React web → versioned REST API → application/domain service
          → provider port → InternalSyntheticTravelProvider
                              (future: independent supplier adapters)
```

The frontend never talks directly to persistence, file storage, or search infrastructure. Provider schemas terminate at adapters and are mapped into canonical domain models. The `AccommodationProvider` is the first port; flight, rail, activity, and destination ports follow with those product slices.

## Domain outline

- **Public catalog:** Destination, Property, Room, Amenity, Activity, Attraction, Restaurant, Airport, RailwayStation, Review.
- **Private, tenant-owned planning:** Tenant, User, Trip, TripMember, Booking (with typed booking details), ItineraryEvent, Document, Favorite, Notification.
- **Operational:** idempotency records, outbox/inbox records, search indexing checkpoints, as needed by measured workflows.

Persist UTC instants. Keep local itinerary wall times together with IANA timezone IDs; do not model India as the only timezone. Money has an explicit ISO currency code; the launch market displays INR.

## Local-first development and deferred production mapping

Immediate priority: run the application and required local dependencies through Docker Compose, retaining the current OIDC/Floci and Cosmos behavior until the local feature set is validated. Dockerizing local development is a development milestone, not the production migration.

After local validation, the planned production baseline is a single low-cost VPS. Keep runtime dependencies provider-neutral and add infrastructure only when an implemented workflow needs it.

| Concern | Current/local-first direction | Deferred production direction |
|---|---|---|
| Web/API runtime | Docker Compose development setup (to be completed) | Docker Compose + Caddy |
| Authentication | Existing OIDC/Floci implementation | Firebase Authentication, verified by the API |
| Canonical/personal data | Existing Cosmos-compatible local identity persistence | PostgreSQL |
| Destination/property discovery | Current deterministic in-process adapter | PostgreSQL full-text search and `pg_trgm`, behind the search port |
| Private originals | Add only with the document feature | Private filesystem volume |
| Durable background jobs | Add only when a durable workflow exists | PostgreSQL-backed queue |
| Secrets/config | Ignored local env file(s), validated configuration | Restricted host-managed deployment configuration |
| Cache | None until a measured need | None until a measured need |
| Telemetry | Structured console logs and health endpoints | Structured logs, health checks, and basic host monitoring |

Firebase is an external authentication dependency. PostgreSQL, Caddy, and the application runtime are open-source; the VPS itself is not free. These are deferred production choices; see [ADR 0004](./adr/0004-self-hosted-vps.md) and [deployment](./deployment.md). The existing Floci/Cosmos/OIDC flow remains the local implementation until local development is validated and a migration is explicitly started.

## Local flows and reliability

- Public property reads use the provider interface; canonical persistence will become the source of truth as the catalog phase is implemented.
- Planned document processing is `authorized upload → private file storage → durable job → idempotent document worker → deterministic extraction → confidence/status validation → user review/correction`. No low-confidence field is silently guessed into a booking.
- Cosmos is used by the current identity slice; PostgreSQL is a deferred production target. Search indexes and caches remain derived/optional.
- Add a durable queue only for asynchronous document processing or notification jobs after those workflows exist. Keep ordinary synchronous work synchronous.
- Workers need bounded retries with exponential backoff, idempotency, and dead-letter visibility. Never blindly retry a non-idempotent booking/write.
- Availability and price are dynamic snapshots; never store them as timeless catalog attributes.
- Provider timeouts/failures should be surfaced as provider errors or partial discovery results by an explicit policy, not silently converted into fake success.

## Security and privacy boundaries

Resolve tenant context from the verified identity and server-side membership data (Firebase after the deferred auth migration). Never accept a browser-provided tenant ID as authorization. Trip membership and role checks are server-side. Every tenant-owned query must be explicitly tenant-scoped and tested against cross-tenant attempts.

Documents and booking data are private. Keep uploaded files outside the web root, use controlled endpoints, validate file size/content signatures, and never place sensitive values in analytics or search documents.

## Delivery phases

1. Workspace, local tooling, discovery/search slice.
2. Docker Compose local development for the web, API, and required local dependencies.
3. Complete the intended local product slices and let the user validate them.
4. After local validation, migrate authentication to Firebase and persistence to PostgreSQL with security tests.
5. PostgreSQL catalog/inventory persistence and repeatable synthetic seed.
6. PostgreSQL search implementation behind the search port.
7. Trips, membership permissions, bookings, and conflict-aware itinerary.
8. Private documents, deterministic extraction/review, PostgreSQL-backed job worker.
9. Analytics/observability hardening and integration/security/E2E suites.
10. VPS Compose deployment, CI/CD, staging, backup/restore validation, and controlled production promotion.

## Important decisions

- Keep a modular monolith: see [ADR 0001](./adr/0001-modular-monolith.md).
- Keep search replaceable and non-critical: see [ADR 0002](./adr/0002-search-port.md).
- Use tenant-scoped PostgreSQL repositories for private records: see [database strategy](./database.md) and [tenancy](./tenancy.md).
