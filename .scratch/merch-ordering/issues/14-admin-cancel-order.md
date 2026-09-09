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

## Comments

- Implemented 2026-09-08 via TDD: added a parametrized
  `test_cancel_succeeds_from_each_active_state` (pending_payment, paid,
  ready_for_collection), `test_a_collected_order_cannot_be_cancelled`, and
  `test_cancelling_an_already_cancelled_order_is_rejected_not_a_silent_noop`
  to `test_order_lifecycle.py` - all green against the existing table (18
  lifecycle tests total now, covering the entire transition graph from the
  PRD). `POST /admin/orders/{reference}/cancel` added via the same
  `_apply_transition` helper. Frontend shows a "Cancel order" button
  alongside whatever the next forward action is, for any order in
  `pending_payment`, `paid`, or `ready_for_collection`; it disappears for
  `collected` and `cancelled` orders since there's nothing to cancel into.
  No stock ledger involvement - cancelling doesn't touch stock counts.
  Verified manually: cancel from each valid state, rejection from
  `collected`, and that cancelling twice is rejected on the second attempt
  rather than silently no-opping.
- Follow-up 2026-09-09: a re-grill flagged that "Cancel order" fired
  immediately on a single click with no confirmation, despite `cancelled`
  being a terminal state with no way back out in the state machine. Added
  a two-step arm/confirm on the button itself (no native `confirm()`
  dialog): first click relabels it "Really cancel? Click to confirm" and
  auto-reverts after 4 seconds if not clicked again; second click within
  that window actually cancels. Verified live: single click only arms it
  (order untouched), the label reverts on its own after the timeout, and
  a genuine two-click sequence transitions the order to `cancelled`.


