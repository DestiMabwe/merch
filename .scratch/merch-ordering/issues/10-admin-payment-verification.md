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
