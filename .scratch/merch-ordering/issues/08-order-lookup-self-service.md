Status: ready-for-agent

# Customer self-service order lookup

## Parent

.scratch/merch-ordering/PRD.md

## What to build

A public page where a customer enters their order reference plus email or phone to view their order's current status, and - if no proof was uploaded at checkout - upload one now.

## Acceptance criteria

- [ ] Public lookup form takes an order reference + email or phone; only returns the order if both match (no way to browse other people's orders by guessing a reference alone)
- [ ] Lookup result shows order status (Pending Payment / Paid / Ready for Collection / Collected / Cancelled), line items, and total
- [ ] If the order has no proof-of-payment attached yet and is not cancelled, the page offers an upload field that attaches one via the file-storage module
- [ ] If the order already has proof attached, the page indicates that
- [ ] Looking up a non-matching reference/contact combination shows a clear "not found" message, not an error page

## Blocked by

- 03-catalog-management
- 05-cart-checkout

## Comments

- Implemented 2026-09-08: `GET /orders/lookup?reference=&email=&phone=` on
  the backend requires reference plus a matching email or phone (a mismatch
  or unknown reference both return a plain 404, so there's no way to
  distinguish "wrong contact" from "no such order" by probing). Frontend
  adds a public `/orders` page (linked from the storefront footer as "Track
  your order") with the lookup form; a found order shows its status via a
  shared `statusLabel()` map (all five states), line items, and total. If
  there's no proof and the order isn't cancelled, an upload field appears
  and reuses the same `POST /orders/{reference}/proof` endpoint from
  07, re-verifying contact on that call too since there's no session token.
  A non-matching lookup shows inline text, not a thrown error. Verified
  manually: correct lookup, wrong-contact "not found", and the on-page
  upload path.

