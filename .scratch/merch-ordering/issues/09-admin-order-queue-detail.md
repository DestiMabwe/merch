Status: ready-for-agent

# Admin order queue & detail view

## Parent

.scratch/merch-ordering/PRD.md

## What to build

The admin-facing order list and detail view - the backbone of the manual reconciliation workflow, since there's no automatic expiry of unpaid orders. Without a way to spot stale pending orders, stock stays silently locked up.

## Acceptance criteria

- [ ] Admin order list shows all orders with status, customer name, reference, and how long ago they were placed
- [ ] List can be filtered by status and sorted by age (oldest-pending-first at minimum), so admins can spot stale unpaid orders holding stock
- [ ] Opening an order shows full detail: line items, customer contact info, reference, current status, and any uploaded proof-of-payment file (viewable/downloadable)
- [ ] Route(s) are protected by the admin auth guard from 02-admin-auth-login

## Blocked by

- 02-admin-auth-login
- 05-cart-checkout-stock-reservation
