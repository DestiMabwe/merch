Status: ready-for-agent

# Cart & checkout

## Parent

.scratch/merch-ordering/PRD.md

## What to build

The core commerce flow: a client-side cart, a checkout form collecting customer name/contact, order submission that generates a unique human-readable order reference, and lands the customer on a confirmation page showing the reference and static bank/EFT payment instructions. This slice introduces the order lifecycle's initial `pending_payment` state.

Stock is not reserved or decremented anywhere in this flow — the print/fulfillment provider owns real production capacity, not this system. A variant's stock count (from 03-catalog-management) is a manual, admin-edited field used only to cap cart quantity and reject checkout against a variant that's currently marked sold out; it is never read-then-written atomically and there is no concurrency handling to build here.

## Acceptance criteria

- [ ] Customer can add multiple products/variants to a cart, adjust quantities, and remove items, with a running subtotal, without needing an account
- [ ] Cart cannot let a customer add more of a variant than its current stock count
- [ ] Checkout form collects name and contact (email and/or phone - phone-only is valid); no camper/cabin or attendee field is collected
- [ ] Submitting checkout creates an order in `pending_payment` state with line items that snapshot product name, variant, and price at time of order (so later catalog edits never alter historical order data)
- [ ] A unique, human-readable order reference is generated per order (via a dedicated reference-generator component) and shown to the customer
- [ ] Confirmation page shows the order reference, order summary, and the church's static bank/EFT details with instructions to use the reference as the payment description
- [ ] If checkout is submitted with a quantity that exceeds a variant's current stock count (e.g. it sold out since being added to the cart), the customer sees a clear message identifying which item, not a generic error — this is a plain validation check against the current count, not a reservation

## Blocked by

- 04-storefront-browsing

## Comments

- Implemented 2026-09-08: `Order`/`OrderLineItem` models + Alembic migration
  (line items snapshot product_name/variant_size/variant_color/unit_price at
  order time, plus product_id/variant_id for traceability). `app/order_reference.py`
  generates a `CM-XXXXXX` reference (unambiguous alphabet, retried on
  collision). `app/routers/orders.py` adds public `POST /orders`: validates
  each variant is active and its current stock covers the requested quantity
  (a plain snapshot check, no reservation/locking), rejects with a message
  naming the specific item otherwise, and requires at least one of
  email/phone. Frontend: `src/lib/cart-context.tsx` is a localStorage-backed
  cart (loaded post-mount to avoid an SSR/hydration mismatch — loading it in
  the initial state made the client tree differ from the server-rendered one
  and React was discarding/remounting the subtree, which was wiping the
  checkout form as the user typed), capped per-variant at the product's
  stock count. Product page gained a quantity+Add to Cart control, new
  `/cart` and `/checkout` pages handle review/edit and the name/email/phone
  form, and checkout's confirmation view reuses the banking-details UI from
  the homepage (`OrderPaymentDetails`, extracted alongside the existing
  `BankingDetails`) but shows the order's real reference instead of the
  name-guess placeholder. Verified manually end-to-end (add to cart, cap at
  stock, checkout, sold-out rejection via curl, confirmation content,
  cart-clear on success) per the PRD's testing scope, which doesn't require
  automated coverage for this flow.

