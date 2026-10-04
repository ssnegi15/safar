# ADR 0001: Start with a modular monolith

- Status: accepted
- Date: 2026-10-02

## Context

The product spans discovery, trip planning, documents, and notifications, but V1 has no independent scaling or ownership requirements that justify distributed services. Early microservices would add deployment, network, and consistency failure modes before the domain and load are known.

## Decision

Use one NestJS modular-monolith API with explicit domain/provider boundaries. Add a separate worker only when a durable asynchronous workflow exists. Deploy the web/API/worker as separate container workloads if operational needs require it, without splitting the domain into independently owned services.

## Consequences

- One REST boundary and one primary data ownership model are easy to develop locally.
- Module boundaries and provider ports can be extracted later behind stable interfaces and events if measured needs justify it.
- Shared in-memory mutable state is not a cross-module integration mechanism.
