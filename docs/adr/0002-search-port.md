# ADR 0002: Keep travel search behind a port

- Status: accepted
- Date: 2026-10-02

## Context

Search infrastructure must not own canonical catalog data or private trip/booking data. The initial deployment targets a single VPS, so a separately operated search service is not justified for V1.

## Decision

Application services call a provider-neutral travel search interface. Start with PostgreSQL full-text search and `pg_trgm`; keep the browser on the REST API. A dedicated search engine may be evaluated later if measured relevance, scale, or feature needs justify its operational cost.

## Consequences

- Local development and the first production deployment use the same PostgreSQL search behavior.
- Search features must be implemented consistently across adapters or explicitly marked as production-only.
- Search cannot become a source of truth for property or user-private data.
