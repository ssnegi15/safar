# Events and background work

## Current state

No event bus, outbox, or worker is started by the discovery slice. The local Floci emulator is available but is not a discovery runtime dependency.

## V1 event boundary

Do not add a queue during the current Docker-first phase unless an implemented workflow truly requires durable asynchronous work. After local validation and the PostgreSQL migration, begin with a PostgreSQL-backed job queue such as `pg-boss`. This avoids introducing a separate broker for the initial single-VPS deployment. Keep synchronous property search and ordinary trip reads/writes in the API request path. Revisit a dedicated broker only when measured throughput or operational requirements justify another service.

Candidate versioned events include `document.uploaded`, `document.processed`, `trip.created`, `booking.created`, `booking.updated`, `property.updated`, `search.index.requested`, and `notification.requested`. Publish only after the authoritative state change is durable. Use an outbox when a database write and event publication must not diverge.

Consumers must be idempotent because delivery is at least once. Add bounded exponential retries and a visible dead-letter workflow; never retry non-idempotent booking operations blindly. Do not publish document contents, passenger data, payment details, or secrets in event payloads.
