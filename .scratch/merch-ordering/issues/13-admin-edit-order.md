Status: ready-for-agent

# Admin edit order line items

## Parent

.scratch/merch-ordering/PRD.md

## What to build

Letting an admin correct an order's line items or quantities after submission (e.g. wrong size). There is no stock ledger to keep in sync — edits don't reserve, release, or otherwise touch any variant's stock count.

## Acceptance criteria

- [ ] From the order detail view, an admin can change a line item's variant and/or quantity, or remove a line item
- [ ] Edited line items continue to snapshot the (possibly new) product/variant name and price at edit time, per the same snapshot rule as order creation
- [ ] Order edits are only available to admins - there is no customer-facing edit path

## Blocked by

- 09-admin-order-queue-detail
