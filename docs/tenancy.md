# Tenancy and authorization

## Phase 2 status

OIDC bearer-token validation, a protected `GET /api/v1/auth/me`, and idempotent personal-tenant bootstrap are implemented. The API verifies RS256 signature, issuer, audience, and expiry using the configured JWKS before trusting identity claims. Cosmos DB stores user and personal-tenant documents in separate `/id`-partitioned containers. The local Floci emulator automatically approves its seeded development identity and is not a real sign-in prompt.

No trip, booking, document, favorite, or other private resource endpoints exist yet. Authorization policies for those resource types and their cross-tenant IDOR tests must be added before those features ship.

After Docker-based local development is complete and validated, replace OIDC with Firebase Authentication and migrate identity and tenant persistence from Cosmos DB to PostgreSQL as a dedicated production-preparation phase. The verified Firebase UID becomes the external identity key; tenant IDs remain application-owned and server-derived. See [deployment](./deployment.md) and [ADR 0004](./adr/0004-self-hosted-vps.md).

## Target model

- Every user belongs to a personal tenant; tenant membership can later include families, groups, or organizations.
- Authentication resolves the user identity. A server-side tenant resolver checks the active tenant against that user's memberships.
- Do not trust `tenantId`, `userId`, owner IDs, or role names supplied in request bodies, query strings, or unsigned browser state.
- Every private repository method requires a tenant-scoped context and uses `tenantId` in its partition key and query predicate.
- `/api/v1/auth/me` has no tenant selector. Its personal tenant ID is deterministically derived server-side from the verified issuer and subject, then checked against the persisted owner record.
- Trip membership roles (`owner`, `editor`, `viewer`) are checked server-side for every operation, not just at route entry.
- Document download/upload authorization checks both tenant and trip/document access; Blob credentials never reach the browser.

## Required tests before private routes ship

Current tests verify missing bearer tokens are denied, signature/audience/expiry are validated, untrusted tenant claims are not mapped into the identity principal, and `/auth/me` does not accept a client-selected tenant. Before private resources ship, attempt cross-tenant list/get/update/delete operations with a known foreign ID; test trip-member role escalation and viewer writes; and test unauthorized document upload/download against repository and API boundaries.
