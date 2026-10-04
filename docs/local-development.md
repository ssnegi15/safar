# Local development

## Requirements

- Node.js 20.12+
- pnpm 9
- Docker Compose for Floci AZ
- `mkcert` for a locally trusted HTTPS certificate (`brew install mkcert` on macOS)

## Start the current application

Create and trust a local development certificate before starting the proxy:

```sh
mkcert -install
mkdir -p infra/floci/certs
mkcert -cert-file infra/floci/certs/localhost.pem \
  -key-file infra/floci/certs/localhost-key.pem \
  localhost 127.0.0.1 ::1
```

Then start the application:

```sh
pnpm install
pnpm infra:up
pnpm dev
```

Floci AZ must already be running on port 4577 for Cosmos-backed API startup. This repository starts only the HTTPS proxy; it does not start another Floci instance. Configure the existing Floci container with `FLOCI_AZ_TLS_ENABLED=true`, `FLOCI_AZ_BASE_URL=https://localhost:4578`, and `FLOCI_AZ_SERVICES_ENTRA_ISSUER=https://localhost:4578/00000000-0000-0000-0000-000000000002/v2.0`, then restart that same container so the proxy can use its TLS listener and OIDC issuer URLs match the public HTTPS address. The web app runs on port 5173 and proxies `/api` to the NestJS API on port 3000. The local OIDC provider is exposed through Caddy at `https://localhost:4578`; MSAL requires HTTPS for authority URLs. Caddy trusts Floci's generated development certificate only on this local hop. Cosmos DB continues to use Floci directly over HTTP on port 4577. If the API port is occupied, choose another API port for both processes:

```sh
API_PORT=3001 npm run dev
```

The web proxy follows `API_PORT`, so API calls continue to work with the alternate port. Discovery still uses generated in-process inventory, but the API now initializes Cosmos containers for authentication and personal-tenant profiles. Local OIDC uses Floci's seeded account and automatically approves sign-in; no password or consent screen is presented. Keep the generated certificate and private key out of source control; the certificate directory is ignored by Git.

Stop only the HTTPS proxy with `pnpm infra:down`; the existing Floci instance is managed separately. The emulator currently uses in-memory storage mode; its contents are not durable.

## Configuration

Copy `.env.example` to an untracked `.env` only when overriding local defaults. `API_PORT` and `WEB_ORIGIN` are validated before the API listens. Production-only credentials do not belong in local source files.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

The API's catalog fixtures are generated deterministically at process start. The `safar` Cosmos database and identity containers are created automatically in local development. There is no catalog `db:seed` or `db:reset` command until catalog persistence exists; adding no-op scripts would make developer setup misleading.

## Floci AZ service support

The local compose file starts one Floci AZ emulator. Its published service list includes Cosmos DB SQL API, Blob Storage, App Configuration, Key Vault, Service Bus, Event Grid, and Redis. Confirm the emulator's current service compatibility before adding a service-specific adapter. Azure AI Search has no Floci AZ endpoint; use the local search adapter.
