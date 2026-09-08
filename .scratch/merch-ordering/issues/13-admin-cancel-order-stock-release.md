Status: ready-for-agent

# Admin cancel order and stock release

## Parent

.scratch/merch-ordering/PRD.md

## What to build

The admin action of cancelling an order, which releases all of its reserved stock back to the catalog. Introduces the `-> cancelled` transition on the order-lifecycle state machine, reachable from `pending_payment` or `paid`.

## Acceptance criteria

- [ ] From the order detail view, an admin can cancel an order that is in `pending_payment` or `paid` state
- [ ] Cancelling triggers exactly one stock-ledger release per line item, returning that stock to its variant
- [ ] A `collected` order cannot be cancelled; attempting it is rejected with a clear error
- [ ] Cancelling an already-cancelled order is a no-op and does not double-release stock
- [ ] Unit tests exist covering: successful cancellation from each valid source state, rejection of cancellation from `collected`, and that repeat cancellation doesn't double-credit stock

## Blocked by

- 09-admin-order-queue-detail
