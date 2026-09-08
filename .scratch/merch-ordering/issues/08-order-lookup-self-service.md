Status: ready-for-agent

# Customer self-service order lookup

## Parent

.scratch/merch-ordering/PRD.md

## What to build

A public page where a customer enters their order reference plus email or phone to view their order's current status, and - if no proof was uploaded at checkout - upload one now.

## Acceptance criteria

- [ ] Public lookup form takes an order reference + email or phone; only returns the order if both match (no way to browse other people's orders by guessing a reference alone)
- [ ] Lookup result shows order status (Pending Payment / Paid / Collected / Cancelled), line items, and total
- [ ] If the order has no proof-of-payment attached yet and is not cancelled, the page offers an upload field that attaches one via the file-storage module
- [ ] If the order already has proof attached, the page indicates that
- [ ] Looking up a non-matching reference/contact combination shows a clear "not found" message, not an error page

## Blocked by

- 03-catalog-management
- 05-cart-checkout-stock-reservation
