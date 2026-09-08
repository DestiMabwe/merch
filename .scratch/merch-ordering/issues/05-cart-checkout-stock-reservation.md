Status: ready-for-agent

# Cart & checkout with stock reservation

## Parent

.scratch/merch-ordering/PRD.md

## What to build

The core commerce flow: a client-side cart, a checkout form collecting customer name/contact, order submission that reserves stock via a new stock-ledger module, generates a unique human-readable order reference, and lands the customer on a confirmation page showing the reference and static bank/EFT payment instructions. This slice introduces the stock ledger and the order lifecycle's initial `pending_payment` state.

## Acceptance criteria

- [ ] Customer can add multiple products/variants to a cart, adjust quantities, and remove items, with a running subtotal, without needing an account
- [ ] Cart cannot let a customer add more of a variant than is currently in stock
- [ ] Checkout form collects name and contact (email and/or phone - phone-only is valid); no camper/cabin or attendee field is collected
- [ ] Submitting checkout creates an order in `pending_payment` state with line items that snapshot product name, variant, and price at time of order (so later catalog edits never alter historical order data)
- [ ] Stock ledger reserves (decrements) stock for each line item atomically at order creation; two simultaneous checkouts competing for the last unit of a variant result in exactly one success and one clear rejection (no overselling) - covered by a unit test against the ledger directly, not just the HTTP layer
- [ ] A unique, human-readable order reference is generated per order (via a dedicated reference-generator component) and shown to the customer
- [ ] Confirmation page shows the order reference, order summary, and the church's static bank/EFT details with instructions to use the reference as the payment description
- [ ] If checkout fails because stock ran out for an item mid-checkout, the customer sees a clear message identifying which item, not a generic error

## Blocked by

- 04-storefront-browsing
