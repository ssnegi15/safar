# ADR 0004: Use a single-VPS deployment baseline

- Status: accepted
- Date: 2026-10-03

## Context

The previous deployment plan selected multiple Azure services before the product had production workflows or a deployment budget. The project needs a practical path to an initial deployment with low operational complexity, while keeping sensitive travel data under application control.

## Decision

- Use Firebase Authentication for user sign-in and server-verified identity.
- Use a single low-cost Linux VPS with Docker Compose and Caddy for the initial web/API deployment.
- Use PostgreSQL as the production source of truth. Migrate the current Cosmos-backed identity implementation before launch.
- Start discovery search with PostgreSQL full-text search and `pg_trgm` behind the existing search port.
- Keep uploaded originals on a private filesystem volume when document upload is implemented.
- Add a PostgreSQL-backed job queue only when a durable asynchronous workflow exists.
- Do not add Kubernetes, a cloud-specific database, a separate cache, broker, or search service without a measured requirement.

## Consequences

- The VPS is low-cost, not free; backups and operations still need a separate budget and restore process.
- Firebase is an external service and its current quotas, pricing, and sign-in providers must be checked before launch.
- A single host is a single failure domain. Maintain encrypted off-host backups, test restores, and document recovery steps before storing production data.
- Provider-neutral interfaces preserve the option to move hosting, search, storage, or background jobs later.
- The existing Floci/Cosmos/OIDC stack remains the current local implementation until migration work is completed; it is not the production target.
