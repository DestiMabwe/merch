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
