# Search architecture

## Current slice

`InternalSyntheticTravelProvider` exposes deterministic destination and accommodation search. The API supports destination, check-in/out, guests, price bounds, property type, rating, amenity, explicit sorting, and pagination. The frontend stores search/filter state in the URL and calls the API only.

Rates and availability are a synthetic point-in-time snapshot separate from stable property fields. Search labels all current results as synthetic demo data.

## Current implementation and deferred production direction

Current implementation: deterministic in-process search. Keep this behavior during the Docker-first local phase.

After local validation and the planned PostgreSQL migration, use `TravelSearchService → TravelSearchProvider → PostgreSQL full-text/pg_trgm adapter`. Do not add a separate search service for the initial VPS deployment. The browser must never access the database or search adapter directly. Keep the provider port so a dedicated search engine can be evaluated if measured query volume, relevance, or feature requirements outgrow PostgreSQL.

Index only public catalog attributes: text, property type, rating, amenity facets, location, and geo fields. Never index private itinerary, contact, booking-document, or passenger data. Availability/pricing remains a separate dynamic inventory path with a bounded TTL; it is not a permanent catalog index field.

## Search behavior

- Explicit sorting by relevance, rate, rating, and popularity; no opaque “best stay” score.
- Server-validated filters and bounded page size.
- Facets/autocomplete/typo tolerance can be added to the PostgreSQL adapter as required by the product slice.
- Once implemented, the same database-backed behavior should run locally and in production; fixtures may remain for unit tests.
- Cache only after measuring repeated destination/property/availability requests; Redis is never source of truth.
