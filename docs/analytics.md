# Analytics and privacy

## Current state

The signed-in journey dashboard records property views and booking starts, and shows aggregate registered-user, view, booking, and funnel counts. The admin dashboard also lists the latest 100 synthetic demo bookings without customer names or email addresses. Access is restricted to verified email addresses configured in `ADMIN_EMAILS`.

The checkout supports a simulated card or UPI success for demos only. It stores the selected demo method, a synthetic reference, amount, and `demo_succeeded` status; it does not collect card/bank credentials or contact a payment provider. This is not a payment integration or real sales reporting.

To view the admin dashboard locally:

1. Set `ADMIN_EMAILS` in the project `.env` to a comma-separated list of verified sign-in email addresses, for example `ADMIN_EMAILS=admin@example.com`.
2. Start/restart the local app with `docker compose up --build`; the database migration creates the demo-payment table.
3. Sign in to the web app using one of those verified accounts. The **Journey** link in the top navigation opens `/admin/journey`.
4. The dashboard shows aggregate analytics and the latest 100 bookings. Use **Refresh** after creating a demo booking. The API endpoints are `GET /api/v1/admin/journey` and `GET /api/v1/admin/bookings`; both require admin authorization.

If the admin navigation link is missing, check that the signed-in email is verified and exactly matches one of the normalized addresses in `ADMIN_EMAILS`, then sign out and back in.

## Product events

An opt-in/consent-aware first-party pipeline may later record low-sensitivity events such as `user.created`, `search.performed`, `property.viewed`, `property.saved`, `trip.created`, `trip.updated`, `booking.created`, `document.uploaded`, and `itinerary.viewed`.

Use allowlisted, typed event attributes. Do not record document text, passport or identity numbers, payment data, passenger names, contact information, private booking fields, or full itinerary details. Avoid destination/date combinations that could expose sensitive travel plans unless justified and privacy-reviewed. Keep analytics identifiers pseudonymous and define retention/deletion rules before collection.

Any future expansion should remain small and exportable to a warehouse later; a data lake is not a V1 prerequisite.
