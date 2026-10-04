# Deployment

## Status

Production infrastructure and deployment automation are not implemented. The current slice uses a local OIDC emulator and Cosmos persistence for identity and personal-tenant records. It has no real inventory or booking workflow, and broader tenant authorization and operational hardening remain incomplete.

The production target below is a plan, not a statement that the current code is ready to deploy. In particular, authentication and identity persistence must be migrated and verified before a public deployment.

## Deferred production target

Do not implement the production migration yet. First make the complete application runnable and testable locally with Docker Compose, finish the planned product slices, and let the user validate the local behavior. After that gate passes, the intended first production target is a single low-cost Linux VPS:

| Concern | Initial target | Notes |
|---|---|---|
| Web/API runtime and TLS | Docker Compose behind Caddy | Caddy terminates HTTPS and routes public web/API traffic. Run containers as non-root on a private Compose network. |
| Authentication | Firebase Authentication | The browser signs in with Firebase; the API verifies Firebase ID tokens using the Firebase Admin SDK. Keep the Firebase project configuration public client-side and its service-account credentials server-side only. |
| Canonical and personal data | PostgreSQL | Migrate the current Cosmos-backed identity repository before deployment. Use tenant-scoped queries, foreign keys, indexes, and transactions. |
| Discovery search | PostgreSQL full-text search and `pg_trgm` | Start with the existing search port and avoid a separate search server until PostgreSQL no longer meets measured needs. |
| Private uploaded files | Private filesystem volume | Add only with document uploads. Keep files outside the web root, enforce authorization in the API, and include them in tested backups. |
| Background jobs | PostgreSQL-backed queue, such as `pg-boss` | Introduce with a real durable asynchronous workflow; do not add Redis or a message broker by default. |
| Secrets and configuration | Host-managed, access-restricted deployment configuration | Never commit secrets. Firebase service-account credentials must not be exposed to the browser or container logs. |
| Logs and health | Structured application logs and health/readiness endpoints | Begin with host/container log collection; add a self-hosted monitoring stack only when operational needs justify its cost and maintenance. |

These are future choices, not current implementation instructions. Keep the existing OIDC/Floci and Cosmos development flow stable while implementing features locally. After local validation, migrate authentication to Firebase and persistence to PostgreSQL as a planned, separately validated phase. Do not introduce production-only infrastructure during the Docker-first phase. Keep external providers behind application ports so later migrations remain possible.

Do not add Kubernetes, Terraform, a cloud-specific database, a managed search service, or a separate cache/queue for the first deployment. Firebase is the selected future authentication service; its pricing, quotas, and supported sign-in methods must be checked against launch requirements before enabling production traffic.

## Later: before a public launch

- Complete the Firebase browser sign-in and server-side token-verification migration; validate issuer, audience, signature, and expiry.
- Replace the Cosmos identity repository with PostgreSQL and prove tenant isolation with integration and security tests.
- Finish the user-facing workflows that the launch intends to support; the current discovery slice is not a booking service.
- Configure the domain, HTTPS, restrictive firewall, non-root containers, production CORS, request limits, and distributed rate limiting appropriate to the deployment.
- Set up automated, encrypted backups stored independently from the VPS, retention/deletion policy, and a documented restore test. A VPS disk alone is not a backup.
- Verify Firebase authorized domains and API audience/configuration; keep service credentials out of the web build and logs.
- Add readiness/liveness checks, error reporting and enough host monitoring to detect an unavailable VPS, failed containers, and exhausted disk.
- Review privacy, data retention, account deletion/export, and incident-response requirements for the launch region.

## Delivery pipeline

Pull requests should run lint, typecheck, tests, security checks, and builds. Main may deploy to a staging environment when available and run smoke checks; production requires deliberate promotion and a rollback path. Do not deploy unreviewed changes directly to production.

The concrete VPS provider, backup destination, domain, and Firebase sign-in methods remain launch configuration decisions. Keep the application and Compose deployment portable until those choices are made.
