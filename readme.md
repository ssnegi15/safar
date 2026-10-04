# Safar

Safar is an India-first travel planner built as a pnpm monorepo. The React and
Vite web app provides destination and accommodation discovery, search,
favorites, trips, itineraries, and a demo booking flow, paired with a NestJS
API for authenticated features.

The local stack uses PostgreSQL and the Firebase Authentication emulator.
Listings, rates, availability, reviews, and bookings are synthetic demo data;
they are not real supplier offers, user reviews, or payments.

## Run locally

Requirements: Node.js 20.12+, Corepack/pnpm 9, and Docker Compose.

```sh
pnpm install
pnpm dev
```

`pnpm dev` builds and starts the local Compose stack.

- Web app: <http://localhost:5173>
- API: <http://localhost:3000/api/v1>
- API documentation: <http://localhost:3000/api/docs>
- API health: <http://localhost:3000/api/v1/health>

Stop the stack with `pnpm infra:down`. Copy `.env.example` to `.env` only when
you need to override local configuration.

## GitHub Pages deployment

The `Deploy UI to GitHub Pages` workflow builds and publishes only the static
web app from `apps/web`; it does not deploy the API or other services. It runs
on pushes to `main` and can also be started manually. In the repository's
**Settings → Pages**, set the build and deployment source to **GitHub Actions**.

Add these Actions repository variables before running the workflow:

- `VITE_FIREBASE_API_KEY` — public Firebase web-app configuration.
- `VITE_FIREBASE_PROJECT_ID` — Firebase project used by the web app.
- `VITE_API_BASE_URL` — absolute URL to the separately deployed API, including
  its `/api/v1` path.

Configure Firebase's authorized domains and the API's CORS policy for the
published Pages origin. The workflow configures the Vite asset base path for
GitHub Pages and includes a fallback page for client-side routes.
