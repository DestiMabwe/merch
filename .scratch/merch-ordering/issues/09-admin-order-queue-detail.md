Status: ready-for-agent

# Admin order queue & detail view

## Parent

.scratch/merch-ordering/PRD.md

## What to build

The admin-facing order list and detail view - the backbone of the manual reconciliation workflow, since there's no automatic expiry of unpaid orders and no service-provider-facing tooling of any kind. This is the one screen the admin (who is also managing print/fulfillment) lives in day-to-day, so it needs to read easily at a glance: status, who, what, and how long ago.

## Acceptance criteria

- [ ] Admin order list shows all orders with status, customer name, reference, and how long ago they were placed, laid out so status is scannable at a glance (e.g. a clear status badge/column, not just plain text mixed in with other fields)
- [ ] List can be filtered by status and sorted by age (oldest-pending-first at minimum), so admins can spot stale unpaid orders and follow up
- [ ] Opening an order shows full detail: line items, customer contact info, reference, current status, and any uploaded proof-of-payment file (viewable/downloadable)
- [ ] Route(s) are protected by the admin auth guard from 02-admin-auth-login

## Blocked by

- 02-admin-auth-login
- 05-cart-checkout

## Comments

- Implemented 2026-09-08: `app/routers/admin_orders.py` adds
  `GET /admin/orders` (optional `status_filter`, `sort=oldest|newest`,
  default oldest-first) and `GET /admin/orders/{reference}`, both gated by
  the existing `get_current_admin` dependency the same way catalog routes
  are. Frontend adds `/admin/products`-style pages: `/admin/orders` (table
  with a status badge per row - a distinct color/weight per status rather
  than plain text - a status/sort control pair, and age shown as
  relative time) and `/admin/orders/[reference]` (full detail: contact
  info, line items, total, and a link to the proof-of-payment file if one
  was uploaded). Verified manually: list with filter/sort, detail view,
  and that hitting `/admin/orders` while logged out redirects to
  `/admin/login` via the same guard as the existing protected routes.

