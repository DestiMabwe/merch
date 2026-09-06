Status: ready-for-agent

# Admin mark collected

## Parent

.scratch/merch-ordering/PRD.md

## What to build

The admin action of marking an order as collected once merch has been physically handed out at camp. Introduces the `paid -> collected` transition on the order-lifecycle state machine.

## Acceptance criteria

- [ ] From the order detail view, an admin can mark a `paid` order as `collected`
- [ ] Attempting to mark an order `collected` when it is not currently `paid` (e.g. still `pending_payment`, or already `cancelled`) is rejected with a clear error
- [ ] Order list/detail clearly distinguish `collected` orders from `paid`-but-not-yet-collected ones
- [ ] Unit test(s) exist covering this transition directly against the order-lifecycle module

## Blocked by

- 10-admin-payment-verification
