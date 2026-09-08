Status: ready-for-agent

# Admin edit order line items

## Parent

.scratch/merch-ordering/PRD.md

## What to build

Letting an admin correct an order's line items or quantities after submission (e.g. wrong size), adjusting the stock ledger by the resulting delta rather than releasing and re-reserving blindly.

## Acceptance criteria

- [ ] From the order detail view, an admin can change a line item's variant and/or quantity, or remove a line item
- [ ] Increasing a quantity or adding a new variant attempts to reserve the additional stock via the ledger; if insufficient stock exists, the edit is rejected with a clear error and the order is left unchanged
- [ ] Decreasing a quantity or removing a line item releases the corresponding stock back via the ledger
- [ ] Edited line items continue to snapshot the (possibly new) product/variant name and price at edit time, per the same snapshot rule as order creation
- [ ] Order edits are only available to admins - there is no customer-facing edit path

## Blocked by

- 09-admin-order-queue-detail
