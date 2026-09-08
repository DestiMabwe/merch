Status: ready-for-agent

# Admin mark collected

## Parent

.scratch/merch-ordering/PRD.md

## What to build

The admin action of marking an order as collected once the customer has physically picked up their merch at camp. Introduces the `ready_for_collection -> collected` transition on the order-lifecycle state machine.

## Acceptance criteria

- [ ] From the order detail view, an admin can mark a `ready_for_collection` order as `collected`
- [ ] Attempting to mark an order `collected` when it is not currently `ready_for_collection` (e.g. still `pending_payment` or `paid`, or already `cancelled`) is rejected with a clear error
- [ ] Order list/detail clearly distinguish `collected` orders from `ready_for_collection` ones still waiting on the customer
- [ ] Unit test(s) exist covering this transition directly against the order-lifecycle module

## Blocked by

- 11-admin-mark-ready-for-collection
