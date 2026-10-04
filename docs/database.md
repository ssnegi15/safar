# Database strategy

## Current identity persistence

The API creates `users` and `tenants` containers with `/id` partition keys in local development. User document IDs are stable hashes derived from the verified OIDC issuer + subject; personal tenant IDs derive from the same verified identity. Tenant ownership is checked on an existing-tenant collision. The browser does not choose, read, or write these IDs.

This is the current development implementation, not the production database plan. Do not expose emulator credentials or production service credentials to the browser.

## Current catalog state

Public discovery inventory is still generated in-process. Cosmos DB catalog persistence and deterministic seed/reset commands remain the next catalog/data phase.

## Deferred PostgreSQL production target

Do not migrate the current local implementation yet. First complete Docker-based local development and user validation. After that gate, migrate identity and personal-tenant persistence to PostgreSQL before production. Model users, tenants, memberships, trips, bookings, documents, favorites, and notifications as relational records as their product slices are implemented. Use foreign keys, unique constraints, transactions, and indexes derived from real access patterns; do not carry Cosmos partition-key design forward as if it were a relational schema.

Every private query must include a server-derived tenant scope. Repository interfaces should make the tenant context explicit, and tests must attempt cross-tenant reads and writes. Evaluate PostgreSQL row-level security as defense in depth when choosing the connection-pooling and transaction model; do not rely on it as a substitute for application authorization.

| Data | Access pattern to support |
|---|---|
| Users and external auth identities | After the auth migration, resolve a verified Firebase UID to the application user; enforce uniqueness of Firebase UID. |
| Tenants and memberships | Load the user's personal tenant and verify membership/role before private operations. |
| Trips and itinerary events | List and mutate only within the active tenant; index tenant and trip identifiers used by queries. |
| Bookings and documents | Tenant-scoped reads/writes; keep document bytes in private storage rather than database rows. |
| Favorites and notifications | Tenant-scoped list and mutation, with indexes matching user/inbox access patterns. |

Add schema migrations and deterministic seed/reset tooling with the PostgreSQL implementation. Production startup must not silently create or alter schema.

## Legacy Cosmos partitioning reference

The following proposal documents the current Cosmos-oriented design only. It is not the production PostgreSQL schema and should not drive new persistence work unless the production target changes.

| Container | Partition key | Main access |
|---|---|---|
| `users` | `/id` | resolve authenticated user |
| `tenants` | `/id` | load current tenant and membership |
| `catalog-properties` | `/id` | property point reads; search uses the search index |
| `destinations` | `/countryCode` | destination browse/reference data |
| `trips` | `/tenantId` | list/read/update a trip inside active tenant |
| `bookings` | `/tenantId` | list and update tenant bookings |
| `documents` | `/tenantId` | authorize metadata and retention/deletion inside tenant |
| `favorites` | `/tenantId` | list and mutate saved properties |
| `notifications` | `/tenantId` | tenant-scoped notification inbox |

`tenantId` is server-derived and is always included in private resource reads/writes. Do not fetch a private item cross-partition and authorize afterward.

Trips can embed a bounded member list and itinerary event list initially if item-size and write contention limits are enforced; split them into tenant-partitioned records if measured growth requires it. Room/amenity details can be embedded in property catalog documents. Keep stable catalog records separate from volatile price/inventory snapshots.

## Consistency, timestamps, and IDs

- Use stable IDs and UTC instants for persisted timestamps.
- Keep IANA timezone identifiers beside local itinerary times.
- Use optimistic concurrency/ETags for multi-editor trip updates.
- Use idempotency keys on non-repeatable user writes.
- The selected production database is the source of truth; caches/indexes must be rebuildable.

The seed generator will be deterministic and explicitly identify synthetic data when Cosmos persistence is added.
