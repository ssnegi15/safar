# Testing strategy

## Current slice

- API unit tests cover deterministic search filters, pagination, rooms, and not-found behavior.
- API E2E tests exercise destinations, property search, validation, and the public error/correlation-ID response shape.
- Web API-client tests cover URL parameters/default pagination and visible API errors.

Run `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`. These commands require the workspace dependencies from `pnpm install`.

## Required before the product is production-ready

- Domain/service unit tests for tenant authorization, idempotency, conflict detection, date/timezone behavior, and document extraction review.
- Cosmos/Blob/Service Bus/search adapter integration tests, using Floci where its current compatibility is adequate and explicit test doubles otherwise.
- E2E tests for authenticated search, property details, trip create/share, booking, document upload/review, and itinerary flows.
- Security tests for cross-tenant access, IDOR, document authorization, privilege escalation, malicious inputs, and rate limiting.
- Performance baselines for property search/detail and tenant-scoped trip reads.

Test synthetic/demo labels and tenant boundaries as behavior, not just fixtures. Do not claim the full required suite passes until it exists and is run.
