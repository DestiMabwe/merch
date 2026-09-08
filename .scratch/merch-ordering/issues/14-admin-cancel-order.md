Status: ready-for-agent

# Admin cancel order

## Parent

.scratch/merch-ordering/PRD.md

## What to build

The admin action of cancelling an order that's abandoned, unpaid indefinitely, or a duplicate. Introduces the `-> cancelled` transition on the order-lifecycle state machine, reachable from `pending_payment`, `paid`, or `ready_for_collection`. There is no stock ledger, so cancelling never releases or otherwise touches any variant's stock count.

## Acceptance criteria

- [ ] From the order detail view, an admin can cancel an order that is in `pending_payment`, `paid`, or `ready_for_collection` state
- [ ] A `collected` order cannot be cancelled; attempting it is rejected with a clear error
- [ ] Cancelling an already-cancelled order is a no-op (clear rejection, not a silent double-transition)
- [ ] Unit tests exist covering: successful cancellation from each valid source state, rejection of cancellation from `collected`, and that repeat cancellation is a no-op

## Blocked by

- 09-admin-order-queue-detail
