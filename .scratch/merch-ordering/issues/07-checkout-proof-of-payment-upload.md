Status: ready-for-agent

# Customer proof-of-payment upload at checkout

## Parent

.scratch/merch-ordering/PRD.md

## What to build

An optional file upload field in the checkout flow letting the customer attach a proof-of-payment screenshot immediately when placing their order, reusing the file-storage module from 03-catalog-management.

## Acceptance criteria

- [ ] Checkout form includes an optional file upload field (image/PDF) for proof of payment
- [ ] If provided, the file is stored via the file-storage module and linked to the created order as its current proof-of-payment attachment
- [ ] If not provided, checkout still completes successfully with no proof attached yet
- [ ] An order has at most one current proof-of-payment file at a time

## Blocked by

- 03-catalog-management
- 05-cart-checkout

## Comments

- Implemented 2026-09-08: rather than accepting a file directly on
  `POST /orders` (which would force it off pure-JSON into multipart, also
  needed by 08's after-the-fact upload), proof-of-payment upload is one
  shared endpoint, `POST /orders/{reference}/proof` (multipart: `email` or
  `phone` to prove ownership, plus `file`), used by both the checkout flow
  and the self-service lookup page. `Order.proof_of_payment_url` added via
  migration. Checkout form has an optional file field; on submit, the
  frontend creates the order first, then immediately calls the proof
  endpoint if a file was chosen - a failure there doesn't fail checkout,
  it just leaves a note that the order exists and proof can be added later
  from the order-lookup page. Rejects non-image/PDF content types and
  cancelled orders. Replacing an existing proof discards the previous one
  (no version history), satisfying "at most one current file." Verified
  manually via curl (correct/wrong contact, wrong file type, replace) and
  through checkout in the browser with a file attached.
