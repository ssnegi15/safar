# Reusable project instructions

Apply these guidelines when developing this project. This file is intended to be copied into other repositories when the same preferences are wanted.

## Work sequence

- Build and run locally with Docker/Docker Compose before making production deployment changes.
- Preserve the working local development flow while implementing features.
- Defer cloud migrations and production infrastructure until the local application is complete and the user has validated it.
- Do not create or update documentation unless the user explicitly asks for documentation changes. Project instruction files may be updated when the user requests instruction changes.
- Do not run tests, test suites, lint, typecheck, build, or other validation commands unless the user explicitly asks. The user will validate changes.
- Implement the requested change without unrelated documentation edits. Report which validation was intentionally not run.

## Secrets and environment configuration

- Never hardcode secrets or place secret values in source code, documentation, examples, fixtures, tests, command output, or container images.
- Secrets and local-only credentials must be stored only in ignored environment files (for example, `.env`); applications may load them into process environment at runtime.
- Keep real `.env` files out of version control. Use `.gitignore` to exclude them.
- An example environment file may contain variable names and clearly fake placeholders only; never copy real values into it.
- Do not print, inspect, or repeat secret values. Do not introduce fallback credentials or default passwords.
- Keep public client configuration distinct from server credentials; do not place service-account keys or other privileged values in frontend variables or bundles.

## Implementation

- Prefer small, complete changes that follow existing project patterns.
- Avoid adding services, dependencies, or abstractions before an implemented feature needs them.
- Keep authorization and tenant scope server-side; never trust client-supplied identity, tenant, role, or ownership values.
- Make configuration errors explicit and fail safely; do not silently substitute credentials or success-shaped fallbacks.
