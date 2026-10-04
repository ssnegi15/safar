# Security

## Implemented in the discovery slice

- DTO validation is transformed, whitelisted, and rejects unknown query fields.
- HTTP security headers are enabled with Helmet.
- CORS is limited to the configured web origin and does not enable credentials.
- A global request-rate guard limits the in-memory API to 120 requests/minute per client; this is development-only and is not distributed production rate limiting.
- API errors use a consistent public shape and do not return stack traces.
- Correlation IDs are generated server-side and returned in `x-request-id`.
- The current API exposes only public synthetic discovery data.

## Phase 2 authentication

- Current implementation: interactive browser sign-in uses authorization code + PKCE through the configured OIDC provider. The SPA sends an access token; the API validates its RS256 signature, issuer, audience, and required claims using remote JWKS.
- Tokens are held in MSAL session storage rather than local storage; the API does not accept an identity or tenant ID from the browser.
- The local Floci Entra emulator auto-approves a seeded demo user and does not provide a login/consent UI. Use it only for local development, never as a production identity provider.
- User and personal-tenant records are currently stored in Cosmos DB. This is not the production persistence target.

## Deferred production authentication target

- Keep the existing local OIDC/Floci flow while Docker-based development is completed and validated. Do not migrate auth as part of routine feature work.
- Migrate the browser to Firebase Authentication and send Firebase ID tokens to the API.
- Verify token signature, issuer, audience, and expiry server-side using the Firebase Admin SDK. Resolve the application user from the verified Firebase UID; never accept a user or tenant identity supplied by the client.
- Keep Firebase service-account credentials server-side and out of web bundles, logs, and source control. Restrict authorized domains and review enabled sign-in providers before launch.
- Replace Cosmos identity persistence with PostgreSQL before deploying. Preserve server-derived tenant resolution and cross-tenant authorization tests through the migration.
- After the production auth migration begins, use the Firebase Auth Emulator for local auth; until then, the existing Floci/OIDC flow remains the implemented local path.

## Required before production/private data

- Add OIDC authentication, CSRF/session or token policy, server-derived active tenant resolution, and role/membership authorization.
- Add cross-tenant/IDOR/privilege escalation security tests before private trip or document endpoints.
- Use a shared rate limiter if/when the API is horizontally scaled; the initial single-VPS in-memory guard is not sufficient against abuse across restarts.
- Restrict PostgreSQL and private file storage to the application host/network. Do not expose database ports or uploaded files publicly.
- Validate upload bytes, file size, and content independently of user-supplied MIME type; use private containers and short-lived controlled access.
- Add audit events for sensitive reads/writes, deletion/export workflows, and privacy-conscious telemetry.
- Set request/body limits and explicit production CORS/security policy; never log document contents, passenger details, credentials, or payment data.

This document is not a security certification. The current authentication slice protects the current-user endpoint and provisions personal identity records; it does not yet implement active-tenant membership authorization, private-resource tenant isolation, production Firebase auth, PostgreSQL persistence, or document controls.
