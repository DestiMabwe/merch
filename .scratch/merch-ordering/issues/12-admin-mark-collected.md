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

## Comments

- Implemented 2026-09-08 via TDD: `test_ready_for_collection_transitions_to_collected`
  and a parametrized invalid-source test (rejecting from `pending_payment`,
  `paid`, `collected`, `cancelled`) added to `test_order_lifecycle.py`,
  both green against the existing table. `POST
  /admin/orders/{reference}/mark-collected` added the same way as the
  other transition endpoints. The status→action map on the order detail
  page naturally surfaces "Mark collected" only once an order reaches
  `ready_for_collection`, and `collected` is a dead end in the UI (no
  action buttons render) matching the state machine having no outgoing
  transitions from it. Verified manually: full pending_payment → paid →
  ready_for_collection → collected walk-through in the browser, list page
  shows the terminal `Collected` badge.

