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
