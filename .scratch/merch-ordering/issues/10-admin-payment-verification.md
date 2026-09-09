Status: ready-for-agent

# Admin payment verification

## Parent

.scratch/merch-ordering/PRD.md

## What to build

The admin action of confirming payment on an order - ticking it as received, and attaching or replacing the proof-of-payment file directly (covering cash/WhatsApp/in-person payments with no customer-side upload). Introduces the order lifecycle's `pending_payment -> paid` transition.

## Acceptance criteria

- [ ] From the order detail view, an admin can tick "payment received," transitioning the order from `pending_payment` to `paid`
- [ ] This transition is implemented via a shared order-lifecycle state machine component, not an ad hoc status field update
- [ ] Admin can upload a proof-of-payment file on an order that has none, or replace an existing one (replacing discards the previous file - no version history required)
- [ ] Attempting the `pending_payment -> paid` transition on an order not currently in `pending_payment` is rejected with a clear error
- [ ] Unit test(s) exist covering this transition directly against the order-lifecycle module (not just via HTTP)

## Blocked by

- 03-catalog-management
- 09-admin-order-queue-detail

## Comments

- Implemented 2026-09-08 via TDD: `app/order_lifecycle.py` is a pure
  `transition(current_status, target_status) -> str` function over a
  static transition table (raises `InvalidTransitionError` otherwise) -
  no DB/HTTP dependency, per the PRD's testing note. `tests/test_order_lifecycle.py`
  covers it directly: valid `pending_payment -> paid`, an invalid skip
  straight to `ready_for_collection`, and rejecting a repeat `paid -> paid`
  attempt (the exact AC case). The table also encodes the `ready_for_collection`/
  `collected`/`cancelled` edges from the PRD, left dormant until 11/12/14
  wire them up. `POST /admin/orders/{reference}/mark-paid` and
  `POST /admin/orders/{reference}/proof` (admin-side upload/replace, no
  contact check needed since it's behind the admin guard) added to
  `admin_orders.py`. Frontend: the order detail page gets a "Mark payment
  received" button (shown only in `pending_payment`) and a proof
  upload/replace control. Verified manually via curl (mark paid, reject
  repeat, unauthenticated 401, admin proof upload) and in the browser.

