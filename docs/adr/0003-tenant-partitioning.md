# ADR 0003: Partition private records by tenant

- Status: proposed for Cosmos implementation
- Date: 2026-10-02

## Context

Tenant-owned trips, bookings, documents, favorites, and notifications must be isolated and commonly accessed within one active tenant. Cross-partition reads by a client-selected tenant ID are not an acceptable authorization model.

## Decision

Use `/tenantId` as the partition key for tenant-owned containers and require the server-resolved tenant ID in every repository operation. Keep the user/tenant identity relationship in a separately keyed membership/tenant model. Public catalog records use non-tenant partition strategies and never contain private itinerary or document data.

## Consequences

- Tenant reads remain partition-local and easier to audit.
- Cross-tenant collaboration must be modeled through explicit membership/authorization and may require a deliberate read path.
- Revisit the proposal against expected tenant size, hot partitions, transactional needs, and Cosmos RU measurements before provisioning production containers.
