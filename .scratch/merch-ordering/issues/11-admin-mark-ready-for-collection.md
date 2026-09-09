Status: ready-for-agent

# Admin mark ready for collection

## Parent

.scratch/merch-ordering/PRD.md

## What to build

The admin action of marking a paid order as "Ready for Collection" once the external print/fulfillment provider has produced it. Introduces the `paid -> ready_for_collection` transition on the order-lifecycle state machine.

## Acceptance criteria

- [ ] From the order detail view, an admin can mark a `paid` order as `ready_for_collection`
- [ ] Attempting to mark an order `ready_for_collection` when it is not currently `paid` (e.g. still `pending_payment`, already `ready_for_collection`, `collected`, or `cancelled`) is rejected with a clear error
- [ ] Order list/detail clearly distinguish `ready_for_collection` orders from `paid`-but-not-yet-printed ones
- [ ] Unit test(s) exist covering this transition directly against the order-lifecycle module

## Blocked by

- 10-admin-payment-verification

## Comments

- Implemented 2026-09-08 via TDD: added `test_paid_transitions_to_ready_for_collection`
  and a parametrized `test_ready_for_collection_is_only_reachable_from_paid`
  (covering `pending_payment`, `ready_for_collection`, `collected`,
  `cancelled` as invalid sources) to `test_order_lifecycle.py`. Both went
  green immediately against the existing transition table from issue 10 -
  no changes needed to `order_lifecycle.py` itself, which is exactly the
  point of having encoded the full graph up front. `POST
  /admin/orders/{reference}/mark-ready-for-collection` added to
  `admin_orders.py` via a small `_apply_transition` helper shared with
  mark-paid. Frontend order detail page picks the next available action
  from a status→action map, so `paid` orders show "Mark ready for
  collection"; the existing `badgeReady` class from 09 already
  distinguishes it on the list. Verified manually end-to-end in the
  browser (paid → ready_for_collection → shows next as "Mark collected").


