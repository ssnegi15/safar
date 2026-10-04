# Safar

Safar is an India-first consumer travel platform. This repository is being built incrementally from the product brief preserved below.

> **Current slice:** responsive destination discovery, URL-driven accommodation search, synthetic INR rates, property/room details, OIDC authorization-code + PKCE sign-in, a protected current-user endpoint, Cosmos-backed personal tenants, a NestJS REST API, API docs, and health endpoints. This is a working foundation, not yet a production booking service. The immediate plan is Docker-first local development and user validation; production migrations are deferred until then.

All current listings, prices, availability, and review counts are deterministic synthetic demo data. Booking is disabled; the sample inventory must not be represented as real supplier offers or user reviews. Local Floci sign-in automatically approves its seeded demo user and is not suitable for production.

## Start locally

Prerequisites: Node.js 20.12+, Corepack, and Docker Compose for Floci. The current Compose setup does not yet containerize the web and API; completing a Docker Compose local environment is the next infrastructure milestone. Start Floci before the API because Cosmos DB is used for identity profiles and personal tenants.

```sh
corepack pnpm install
pnpm infra:up
npm run dev
```

- Web: <http://localhost:5173>
- API: <http://localhost:3000/api/v1>
- OpenAPI: <http://localhost:3000/api/docs>
- Health: <http://localhost:3000/api/v1/health>
- Floci AZ: <http://localhost:4577>

Stop the emulator with `pnpm infra:down`. See [docs/deployment.md](./docs/deployment.md) for the deferred production plan and local-first gate.

The current discovery catalog is generated in process; identity records use Cosmos DB, and the local API creates the `safar` database plus its identity containers automatically. `db:seed`, `db:reset`, and `search:reindex` will be added with their catalog/search implementations rather than exposed as no-op commands.

See [docs/architecture.md](./docs/architecture.md), [docs/local-development.md](./docs/local-development.md), [docs/database.md](./docs/database.md), [docs/search.md](./docs/search.md), [docs/security.md](./docs/security.md), and [docs/tenancy.md](./docs/tenancy.md) for current design boundaries and delivery status.

## Original product brief (historical requirements)

The brief below is preserved for product context. Its earlier Azure production assumptions are superseded by the current local-first plan: Docker Compose development first, followed by user validation, then a separately planned Firebase Authentication/PostgreSQL production migration. See [deployment](./docs/deployment.md) and [ADR 0004](./docs/adr/0004-self-hosted-vps.md) for the current direction. Reusable development instructions are in [.github/copilot-instructions.md](./.github/copilot-instructions.md).

You are a senior staff-level full-stack engineer, cloud architect, security engineer, DevOps engineer, and product engineer. Build a production-ready consumer travel platform for the Indian market. The product should eventually be capable of competing with large consumer travel platforms, but V1 must prioritize working software, simplicity, maintainability, scalability, and a strong foundation over unnecessary complexity. Do not overengineer the system. Do not introduce microservices, Kubernetes, Kafka, complex event sourcing, ML pipelines, or other infrastructure unless there is a concrete requirement for it. The application must be designed so those things can be introduced later without rewriting the core domain.

The application is a consumer travel platform where users can discover destinations, search hotels/properties, filter and sort properties, view property details and rooms, view prices and availability, save/favorite properties, create trips, add flights, trains, hotels and activities, upload booking confirmations/documents, extract booking information from documents using deterministic parsing for now, build a unified itinerary, view trips on a timeline, detect basic itinerary conflicts, share trips, receive notifications, search their travel information, and view past and upcoming trips.

AI is explicitly NOT part of V1. Do not build an AI chatbot, AI agent, LLM itinerary generator, AI recommendation engine, or AI-generated itinerary system. However, design clean interfaces so Azure AI services can be introduced later. Azure AI Search should still be used for travel discovery/search where practical, but AI Search must not become a dependency for the entire application.

The initial market is India. Use INR, Indian cities and states, Indian airports, Indian railway stations, IST/IANA timezone handling, Indian address formats, and Indian phone number validation. However, do not hard-code the domain to India. The domain must support additional countries later.

The application must be multi-tenant from day one. A consumer user can have a personal tenant, while future tenants can represent families, travel groups, or organizations. Every tenant-owned resource must be tenant-scoped. Never trust tenantId supplied by the browser. Tenant context must be derived from the authenticated identity/session and validated server-side. All repository queries for tenant-owned resources must enforce tenant isolation. Add automated tests specifically attempting cross-tenant access.

Use React + TypeScript + Vite for the frontend. Use React Router, TanStack Query, and a mature UI/component system. The frontend must be responsive, mobile-friendly, accessible, polished, and feel like a real consumer travel product rather than an admin dashboard. Use loading states, skeletons, empty states, error states, pagination or infinite scrolling where appropriate, optimistic UI where safe, and URL-based search state.

Use NestJS + TypeScript for the backend. Use a REST API with OpenAPI, strict validation, and a modular monolith architecture. Do not create many independently deployable microservices. Use a separate worker application for background processing where appropriate.

Use pnpm and a sensible monorepo structure similar to:

travel-platform/
├── apps/
│ ├── web/
│ ├── api/
│ └── worker/
├── packages/
│ ├── contracts/
│ ├── domain/
│ ├── validation/
│ ├── shared/
│ ├── azure/
│ └── search/
├── infrastructure/
│ ├── floci/
│ └── terraform/
├── tests/
│ ├── integration/
│ ├── e2e/
│ ├── security/
│ └── performance/
├── docs/
├── scripts/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json

Adjust the structure if there is a strong technical reason, but keep the repository easy to understand.

The backend should be a modular monolith with modules approximately including auth, users, tenants, destinations, properties, rooms, search, trips, bookings, itinerary, documents, notifications, favorites, analytics, and health. Keep domain boundaries clear. The API should be stateless. Background processing can run in the worker application.

Production infrastructure is deferred until the local application is complete and validated. The current proposed target is a low-cost VPS with Docker Compose/Caddy, Firebase Authentication, and PostgreSQL; add other open-source services only when an implemented feature needs them. Do not add services just because they exist.

Use Floci AZ for local Azure-compatible development. Use Floci AZ for supported local services such as Cosmos DB, Blob Storage, Service Bus, Event Grid, Redis, Key Vault, App Configuration, and other services that are actually supported and needed. Check the current Floci AZ supported service matrix before configuring it. Do not invent unsupported Floci services. Azure AI Search is not available through Floci AZ, so keep Azure AI Search behind an abstraction and provide an appropriate local development implementation or local fallback where necessary. The application must remain runnable locally without requiring a production Azure AI Search instance. Do not create a completely separate architecture for local development.

There must be NO Booking.com integration and NO Agoda integration. Do not scrape Booking.com, Agoda, Expedia, or other travel websites. Do not make the architecture dependent on those companies. For V1, use a realistic deterministic synthetic travel inventory.

Create an internal provider called InternalSyntheticTravelProvider. It should behave like a real supplier and implement provider interfaces such as AccommodationProvider, FlightProvider, RailProvider, ActivityProvider, and DestinationProvider. The rest of the application must depend on these interfaces rather than directly on the synthetic provider. Future real providers should be able to implement the same interfaces without requiring frontend or domain rewrites.

Create realistic deterministic synthetic travel data for India. Running pnpm db:seed should produce the same dataset every time. Include destinations such as Goa, Mumbai, Delhi, Jaipur, Udaipur, Bengaluru, Hyderabad, Kochi, Manali, Kashmir, Varanasi, Chennai, Pune, and Ahmedabad. Include enough synthetic properties to make search meaningful. Properties should contain names, descriptions, property types, star ratings, addresses, cities, states, countries, latitude, longitude, amenities, images, policies, ratings, and review counts. Include multiple room types with occupancy, bed configuration, amenities, prices, taxes, cancellation policies, and availability. Include activities, attractions, restaurants, airports, railway stations, synthetic flights, synthetic trains, availability, prices, and synthetic reviews. Clearly identify synthetic/demo data internally and never represent it as real user-generated content.

Create a proper provider abstraction. For example, AccommodationProvider should support search, getProperty, and getAvailability. FlightProvider should support flight search. RailProvider should support rail search. ActivityProvider should support activity search. The domain must not depend on provider-specific schemas. Normalize provider-specific data into canonical domain models.

Use canonical domain entities such as Tenant, User, Destination, Property, Room, Amenity, Activity, Attraction, Restaurant, Airport, RailwayStation, Flight, Train, Trip, TripMember, Booking, HotelBooking, FlightBooking, TrainBooking, ActivityBooking, ItineraryEvent, Document, Favorite, Notification, and Review. Do not create unnecessary entities. Keep the model understandable.

The current local identity slice uses Cosmos-compatible persistence. After local validation, the proposed production database is PostgreSQL. Design its relational schema around actual access patterns, with tenant-scoped queries, constraints, transactions, and indexes. Use optimistic concurrency where appropriate. Use stable IDs. Store persisted timestamps in UTC and use IANA timezone identifiers for local travel times.

The current search implementation uses deterministic in-process data. After local validation and the PostgreSQL migration, begin with PostgreSQL full-text search and `pg_trgm` behind a `TravelSearchService` abstraction. The frontend must never communicate directly with the database. Do not require an LLM or vector embeddings in V1.

Do not introduce a separate search indexing pipeline unless measured requirements justify it. If a dedicated derived index is added later, it must be rebuildable from canonical data and never be treated as the source of truth.

Hotel search should support destination, check-in, check-out, guests, rooms, price range, property type, rating, and amenities. Support sorting by relevance, price, rating, and popularity. Do not implement an opaque "best hotel" score. Ranking should be explainable and configurable.

Separate stable catalog data from dynamic inventory. Stable catalog data includes property, room, amenities, location, descriptions, and images. Dynamic data includes availability, price, taxes, inventory, and cancellation rules. The synthetic provider should simulate live inventory. Use sensible short-lived caching for dynamic data. Never treat live pricing as permanent catalog data.

Users must be able to create trips. A trip should support name, destinations, start date, end date, timezone, members, bookings, itinerary events, and notes. Trip membership should support at least owner, editor, and viewer permissions. Enforce these permissions server-side.

Create a unified itinerary timeline that can contain flights, trains, hotel check-ins/check-outs, transfers, activities, and other events. Normalize different booking types into itinerary events. Implement deterministic conflict detection for overlapping events, impossible travel times, hotel check-in after planned activities, flight departures before activities finish, and timezone inconsistencies. Do not use AI for conflict detection.

Users must be able to upload booking documents including PDF and supported image formats. Store originals in private storage outside the web root. Use a durable job only when needed, with idempotent processing through parsing and validation. For V1, implement deterministic extraction for known synthetic/demo formats. Never silently guess uncertain values. Store extraction status/confidence and allow users to review and correct extracted fields.

Security is a first-class requirement. Implement authentication, authorization, tenant isolation, input validation, secure HTTP headers, correct CORS configuration, rate limiting, request size limits, file type and file size validation, secure Blob access, signed temporary URLs where appropriate, secrets in Key Vault, managed identities in production, audit logging, and structured security events. Never trust tenant IDs, user IDs, ownership IDs, role claims, uploaded filenames, or MIME types supplied by clients. Never store secrets in source code or git. Never expose Cosmos DB directly to the browser. Never expose Blob Storage publicly. Never expose internal stack traces to clients.

Implement server-side authorization policies/guards. A user must not be able to access another tenant's trip or document even if they know the ID. Write automated security tests for cross-tenant access, IDOR, unauthorized trip access, unauthorized document access, privilege escalation, malicious input, and rate limiting.

Blob Storage must be private. Do not expose storage credentials to the frontend. Use controlled upload/download endpoints and short-lived signed URLs when appropriate. Validate file size and content type, use safe filenames, consider checksums/hashes, and implement deletion and retention workflows.

Use events only where they provide real value. Examples include trip.created, booking.created, booking.updated, document.uploaded, document.processed, property.updated, and notification.requested. Add a PostgreSQL-backed queue only when durable asynchronous processing is actually needed. Implement retries, exponential backoff, failed-job visibility, and idempotency. Do not turn every function call into an event.

Implement privacy-conscious analytics. Track product events such as user.created, search.performed, property.viewed, property.saved, trip.created, trip.updated, booking.created, document.uploaded, and itinerary.viewed. Never put passport numbers, payment data, document contents, or sensitive private booking details into analytics events. Build an analytics pipeline that can later feed a dedicated warehouse, but do not introduce a massive data lake for V1.

Implement observability with structured logging, request correlation IDs, distributed tracing where practical, metrics, health checks, readiness/liveness checks, performance monitoring, and error tracking. Start with health endpoints and structured logs; defer additional monitoring services until justified. Provide /health, /health/live, and /health/ready. Do not expose sensitive diagnostic information.

Use API versioning such as /api/v1/.... Use OpenAPI. Use consistent errors such as { "code": "RESOURCE_NOT_FOUND", "message": "Trip not found", "requestId": "..." }. Support idempotency for operations where duplicate requests could create duplicate actions.

Required frontend pages include /, /search, /hotels, /hotels/:id, /trips, /trips/new, /trips/:id, /trips/:id/itinerary, /bookings, /favorites, /profile, and /login. The UI should have a polished original travel aesthetic, with strong search, destination photography, cards, maps/location context, ratings, filters, clear pricing, and strong mobile UX. Do not copy the visual design of Booking.com, Agoda, Airbnb, or any other competitor.

Use Redis only where it provides measurable value, such as destination metadata, property details, search configuration, short-lived availability responses, and frequently requested reference data. Never use Redis as the source of truth.

Use Terraform for production infrastructure. Structure infrastructure into reusable modules and environments for dev, staging, and production. Do not hard-code Azure resource IDs. Use managed identity, Key Vault, monitoring, backups, scaling, secure networking where justified, resource tagging, and cost controls.

Create GitHub Actions CI/CD. Pull requests should run lint, typecheck, unit tests, integration tests, security checks, and builds. Main branch should build container images, run security scanning, deploy staging, and run smoke tests. Production deployment should require explicit controlled promotion. Do not automatically deploy every commit to production.

Provide production-quality Dockerfiles using multi-stage builds, non-root containers, minimal runtime images, deterministic dependency installation, and health checks.

Testing is mandatory. Implement unit tests for domain logic and services, integration tests for Cosmos/Service Bus/Blob/search abstractions, E2E tests for login, hotel search, property details, trip creation, booking creation, document upload/processing, itinerary display, and trip sharing. Implement dedicated security tests for cross-tenant access, IDOR, unauthorized document access, privilege escalation, malicious input, and rate limiting. Implement basic performance tests for property search, property detail, and trip retrieval.

Create a deterministic seed generator with enough variety to test filters, pagination, sorting, geo search, availability, conflicting itineraries, multiple travelers, room types, cancellations, and different price ranges. Do not create ten identical hotels.

Provide a local demo account and realistic demo trips. Include a Goa trip containing flight + hotel + activities, a Rajasthan trip containing train + hotels + activities, and a Kerala trip containing flight + hotels + activities. At least one demo trip should intentionally contain itinerary conflicts so the conflict detection UI can be demonstrated.

Create strongly typed centralized configuration. Separate local, test, staging, and production configuration. Do not access random environment variables throughout the codebase. Validate configuration on application startup and fail fast when required production configuration is missing.

Implement consistent error handling for validation errors, authentication errors, authorization errors, not found, conflict, rate limiting, provider failures, and internal errors. Do not leak implementation details.

Treat providers as unreliable. Even the synthetic provider should be able to simulate timeout, unavailable response, stale data, and rate limiting. The application should handle provider failures gracefully using timeouts, safe retries, exponential backoff, circuit breakers where justified, and partial results synthetic provider or a future real provider. The architecture must be React → REST API → domain/search service → provider interface → provider questions, personalization, and recommendations. Do not call it in V1. including architecture.md, local-development.md, database.md, search.md, security.md, tenancy.md, events.md, analytics.md, deployment.md, testing.md, and supplier-integration.md. The root README must explain the project, architecture, prerequisites, installation, where appropriate. Never retry non-idempotent operations blindly.

The frontend must never know whether data comes from the synthetic provider or a future real provider. The architecture must be React → REST API → domain/search service → provider interface → provider implementation. Future provider integrations must not require a frontend rewrite.

Do not implement AI now. However, create clean extension points such as a TravelIntelligenceProvider interface for future itinerary generation, trip questions, personalization, and recommendations. Do not call it in V1. Keep Azure AI Search independent from future LLM functionality.

Treat travel data as potentially sensitive. Booking confirmations, passenger information, travel documents, contact information, and itinerary details are private user data. Minimize data collection, implement deletion workflows, design for data export, and ensure private data cannot accidentally become publicly searchable.

Create documentation including architecture.md, local-development.md, database.md, search.md, security.md, tenancy.md, events.md, analytics.md, deployment.md, testing.md, and supplier-integration.md. The root README must explain the project, architecture, prerequisites, installation, local startup, Floci setup, seed data, tests, deployment, and environment configuration.

A new developer should be able to clone the repository and run approximately:

pnpm install
pnpm infra:up
pnpm db:seed
pnpm dev

Document the exact commands and adjust them if the selected tooling requires different names. Provide scripts such as pnpm dev, pnpm build, pnpm lint, pnpm typecheck, pnpm test, pnpm test:e2e, pnpm db:seed, pnpm db:reset, pnpm search:reindex, pnpm infra:up, and pnpm infra:down.

Important constraints: never scrape Booking.com or Agoda; never depend on Booking.com or Agoda; never put provider-specific assumptions into the core domain; never put secrets in git; never expose Cosmos directly to the browser; never expose Blob Storage publicly; never trust client-supplied tenant IDs; never use AI as a V1 critical dependency; never introduce Kubernetes for V1; never introduce Kafka for V1; never create unnecessary infrastructure; never claim synthetic data is real; never silently guess uncertain extracted booking information; never store sensitive information in analytics events; never build unnecessary abstractions.

Write production-quality code using strong typing, small modules, explicit interfaces, dependency inversion, testable services, clear naming, predictable error handling, secure defaults, idempotent operations, and observable background jobs. Avoid giant service classes, giant controllers, duplicated business logic, magic strings, hidden global state, excessive abstractions, and premature generic frameworks.

The target is simple architecture + strong boundaries + production-grade behavior.

Do not generate the entire application as one enormous response. Work incrementally. First inspect the repository if one already exists. Then provide the architecture, repository structure, key domain entities, Azure/Floci service mapping, local development architecture, security model, search architecture, data pipeline, implementation phases, and important ADRs. After that, begin implementing the first vertical slice.

Recommended implementation order:

Repository, tooling, Docker Compose local development, and existing Floci infrastructure.

Authentication, tenants, and authorization.

Travel domain, synthetic provider, and persistence for implemented local workflows.

Travel search behind an abstraction.

Hotel/property UI.

Trips and itinerary.

Booking/document ingestion.

Events, workers, and notifications.

Analytics and observability.

Security hardening and E2E tests.

After local validation: Firebase/PostgreSQL migration, then VPS deployment and staging.

Production hardening.

After every implementation slice, run the relevant tests, typecheck, lint, and build, fix failures, and update documentation. Do not continue while the current slice is fundamentally broken.

Do not ask questions that can reasonably be resolved from these requirements. Use sensible production-grade engineering judgment for ordinary implementation decisions. Only ask a question if proceeding would require a decision that materially changes the product, security model, data ownership, or architecture. Otherwise make the decision, document it in an ADR when appropriate, and continue.

The definition of done is not "the code compiles". The application must actually work end-to-end: frontend works, backend works, local Floci environment works, synthetic data seeds successfully, hotel search works, filters work, property details work, trips work, bookings work, itinerary works, document ingestion works, tenant isolation is tested, authorization is tested, background workers work, search indexing works, analytics events work, observability works, tests pass, Docker builds work, CI passes, Terraform is valid, staging deployment is documented, production configuration is documented, and identified security issues are fixed or explicitly documented.

Build a real maintainable scalable production application that starts with synthetic travel inventory and can later connect to real travel suppliers without a rewrite.
