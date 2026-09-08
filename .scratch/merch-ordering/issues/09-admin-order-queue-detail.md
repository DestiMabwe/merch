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
