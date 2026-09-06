Status: ready-for-agent

# Merch Ordering Tool

## Problem Statement

The church runs a camp merch sale (hoodies, tees, caps, etc.) every year. Today this is handled with a plain Google Form, which works for collecting orders but feels nothing like a store — there's no product browsing, no cart, no per-variant stock awareness, and no structured way for the secretary or other admin staff to confirm that a specific order's payment has actually come in (the church cannot process real payments online, for church-protocol reasons, so payment happens off-platform via bank transfer and has to be reconciled by hand).

A previous attempt to solve this ballooned into a full mobile-first camp app (`purpose-camp`) with authentication, chat, challenges, a schedule, and a Bible-verse feature — none of which this problem needs. That app stays as-is, untouched, and is not part of this effort. This PRD scopes a new, standalone project that does only what's needed: a storefront that feels like e-commerce on the front end, backed by a simple order-collection-and-verification system on the back end.

## Solution

Build `camp-merch-store` as its own small, standalone full-stack project (Next.js frontend + FastAPI backend + relational DB), decoupled from `purpose-camp` entirely — no shared auth, no shared database, no roster integration.

- **Public storefront** (no customer login required, same as a Google Form): customers browse a small catalog of products with size/color variants, add items to a cart, and check out by providing their name and contact details. The store is open to anyone ordering merch, not just campers attending — there is no camper/cabin or attendee field.
- **No real payment processing**: at the end of checkout, the customer sees the church's static bank/EFT details and a unique order reference to use as their payment description. They may optionally upload a proof-of-payment screenshot immediately, or do so later.
- **Stock awareness**: each variant has a stock count that decrements the moment an order is placed (reserved), so the storefront never oversells. Stock is only released back if an admin explicitly cancels the order — there is no automatic expiry of unpaid orders.
- **Admin panel** (seeded, fixed list of admin accounts — the secretary and any other staff you add — all with equal permissions): view the order queue, open an order to see any uploaded proof, tick off "payment received" (uploading proof on the customer's behalf if none was provided at checkout, or replacing it), mark an order "collected" once merch is handed out at camp, and edit or cancel orders as needed (cancelling releases reserved stock). Admins also fully manage the product catalog (create/edit/deactivate products and variants, set stock, upload photos).
- **Customer self-service lookup**: customers can check their order's status later using their order reference plus email/phone, without an account.

This is a one-off build for the current camp's sale — there is no concept of multiple seasons/events; one active catalog exists at a time.

## User Stories

### Storefront browsing & cart
1. As a customer, I want to browse a grid of available merch products with photos and prices, so that I know what I can buy before committing to an order.
2. As a customer, I want to open a product and choose a size/color variant, so that I order the exact item I want.
3. As a customer, I want to see when a specific variant is sold out, so that I don't try to order something unavailable.
4. As a customer, I want to add multiple different products (and variants) to a single cart, so that I can order several items in one go.
5. As a customer, I want to adjust quantities or remove items from my cart before checking out, so that I can correct mistakes before submitting.
6. As a customer, I want to see my cart subtotal update as I add/remove items, so that I know the total before checkout.

### Checkout
7. As a customer, I want to check out without creating an account, so that ordering merch is as low-friction as filling out a form.
8. As a customer, I want to provide my name and contact details (phone/email) at checkout, so that the church can reach me about my order.
9. As a customer, I want my chosen items' stock to be reserved the moment I submit my order, so that I don't lose the item to someone else while I go pay.
10. As a customer, I want to see a unique order reference number after checkout, so that I can quote it in my bank transfer and use it to look up my order later.
11. As a customer, I want to see the church's bank/EFT details clearly at the end of checkout, so that I know exactly how and where to pay.
12. As a customer, I want to optionally upload a screenshot/photo of my proof of payment at checkout, so that I don't have to send it through a separate channel.
13. As a customer, I want to receive an order confirmation email summarizing my order, reference number, and payment instructions, so that I have a record I can refer back to.
14. As a customer, if I don't have an email address handy, I want checkout to still work with just a phone number, so that I'm not blocked from ordering.

### Post-checkout / self-service
15. As a customer, I want to look up my order's status later using my order reference plus my email or phone, so that I can check whether my payment has been confirmed without contacting the church.
16. As a customer, I want to upload my proof of payment after checkout (if I didn't do it at checkout time), so that I can still get my payment verified without needing to contact an admin directly.
17. As a customer, I want to see whether my order is Pending Payment, Paid, or Collected when I look it up, so that I know what to do next (e.g. come pick it up).

### Admin — order management
18. As an admin, I want to log in with a seeded admin account, so that only authorized church staff can access order and payment data.
19. As an admin, I want to see a list of all orders with their status, so that I can triage what needs attention.
20. As an admin, I want to filter/sort orders by status and by how long they've been pending, so that I can spot stale unpaid orders that are quietly holding stock hostage (since there's no auto-expiry).
21. As an admin, I want to open an individual order and see its full details (items, customer info, reference, any uploaded proof), so that I have everything needed to verify payment.
22. As an admin, I want to tick "payment received" on an order, so that its status moves to Paid and the customer/order record reflects that.
23. As an admin, I want to upload a proof-of-payment file to an order myself, so that I can attach evidence even when the customer paid via a channel outside the platform (cash, WhatsApp, in person).
24. As an admin, I want to replace an existing proof-of-payment file on an order, so that I can correct a wrong or unclear upload.
25. As an admin, I want to mark an order as "Collected" once the customer has picked up their merch, so that I can track who still needs to collect.
26. As an admin, I want to edit an order's line items or quantities, so that I can fix a mistake (e.g. wrong size) without forcing the customer to reorder.
27. As an admin, I want to cancel an order, so that I can free up reserved stock when an order is abandoned, unpaid indefinitely, or a duplicate.
28. As an admin, when I cancel an order, I want its reserved stock automatically released back to the catalog, so that other customers can order it.

### Admin — catalog management
29. As an admin, I want to create a new product with a name, description, price, and photo, so that it appears in the storefront.
30. As an admin, I want to define size/color variants for a product with independent stock counts, so that customers can only order what's actually available in each variant.
31. As an admin, I want to edit a product's details, price, or photo, so that I can correct or update listings without recreating them.
32. As an admin, I want to deactivate a product or variant (hide it from the storefront) without deleting its order history, so that discontinued items disappear from new orders but past orders remain intact.
33. As an admin, I want to manually adjust a variant's stock count, so that I can correct discrepancies (e.g. physical recount, restock).

### Cross-cutting / edge cases
34. As an admin, I want order references to be unique and human-readable (short, easy to read back over the phone or write on a form), so that reconciling payments against bank statements is practical.
35. As a customer, I want the system to prevent me from ordering more of a variant than is currently in stock, so that I don't submit an order that can't be fulfilled.
36. As an admin, I want to see which orders are unpaid and how old they are, so that I can decide when to manually cancel them and free the stock (no automatic cancellation exists).
37. As a customer, I want checkout to fail clearly and tell me why (e.g. "this size just sold out") if someone else reserves the last unit of a variant while I'm checking out, so that I'm not confused by a silent failure.

## Implementation Decisions

- **Project structure**: standalone repo (`camp-merch-store`), fully decoupled from `purpose-camp` — no shared database, auth, or user/roster data. Orders are not tied to a camper or cabin — anyone can place an order regardless of whether they're attending camp.
- **Stack**: Next.js frontend, FastAPI backend, a relational database (Postgres or SQLite — pick SQLite for local dev simplicity, Postgres for anything resembling production). No MongoDB, no Motor — orders/products/variants are relational data (products → variants → order line items), which fits a relational model better than the document store `purpose-camp` used.
- **No customer authentication**: the storefront and checkout are fully public. There is no customer account system, session, or JWT for shoppers.
- **Admin authentication**: a simple session or JWT-based login against a small, fixed, developer-seeded list of admin accounts. All admin accounts have identical permissions — there is no tiered role system (no "secretary vs. staff" distinction in permissions).
- **Catalog module**: `Product` (name, description, photo, active flag) has many `Variant`s (size/color combination, price, stock count, active flag). Deactivating a product/variant hides it from the public storefront but does not delete or alter historical order line items referencing it (line items should snapshot the product name/variant/price at order time so catalog edits never retroactively alter past orders).
- **Stock ledger module**: a dedicated, isolated component responsible for all stock mutations — reserve (on order creation), release (on order cancellation). It must guard against race conditions so two simultaneous checkouts can't both reserve the last unit of a variant (e.g. an atomic conditional decrement at the DB level, not a read-then-write in application code). This is the only module in the system with real concurrency risk and should not have its logic inlined into request handlers.
- **Order lifecycle module**: an explicit state machine with states `pending_payment → paid → collected`, plus a `cancelled` state reachable from `pending_payment` or `paid`. Transitions are validated (e.g. `collected` is only reachable from `paid`; `cancelled` triggers a stock-ledger release). No automatic time-based transition exists — orders stay in `pending_payment` indefinitely until an admin acts.
- **Order reference generator**: produces a short, unique, human-readable reference per order (e.g. a prefixed sequential or short random code), independent of the numeric database ID, used both in customer-facing payment instructions and admin-side reconciliation/search.
- **File storage module**: an abstraction over "store a file, get back a retrievable URL," used for both proof-of-payment uploads and product photos. Should support a local-disk backend for development and be swappable for an S3-compatible backend (mirroring the `storage_service.py` pattern from `purpose-camp`) without changing calling code, since hosting/storage provider is not yet decided.
- **Proof-of-payment attachment**: an order can have at most one current proof-of-payment file at a time. Customers may attach one at checkout or afterward via the self-service lookup page (while the order is not yet cancelled); admins may attach or replace it at any time from the admin panel. Replacing a file does not preserve the previous version.
- **Notifications module**: a single notification today — the order-confirmation email sent immediately after checkout, containing the order summary, reference number, and payment instructions. Built behind a generic "send order notification" interface so that a future "paid" or "collected" email is an additive call, not a rewrite.
- **Order editing**: only admins can edit line items/quantities or cancel an order after submission. Customers cannot self-edit or self-cancel; if a customer needs a change, they contact the church and an admin makes it.
- **Fulfillment**: pickup-only. No address field, no delivery option, no shipping cost calculation anywhere in the checkout flow.
- **Single active catalog**: no season/event/sale-cycle concept in the data model. If reused for a future camp, the catalog and stale orders would need manual archiving/reset — this is explicitly not built for now.
- **Hosting**: not decided. Backend and frontend should be built host-agnostic (standard FastAPI + SQL DB + env-configured file storage) rather than coupled to a specific provider's SDK/features.

## Testing Decisions

Automated tests are scoped to the two modules carrying real correctness risk — logic bugs elsewhere are cheaper to catch by hand at this project's size, but these two are exactly the kind of thing that looks fine until a specific interleaving or edge case hits production during a real sale:

- **Stock ledger**: test that a reserve on a variant with sufficient stock succeeds and decrements correctly; that a reserve attempted against insufficient/zero stock is rejected (no negative stock); that two concurrent reserve attempts against the last unit of a variant result in exactly one success and one rejection (no overselling); that a release (from order cancellation) correctly increments stock back; that releasing an order that was never reserved, or releasing twice, doesn't double-credit stock.
- **Order lifecycle**: test every valid state transition (`pending_payment → paid`, `paid → collected`, `pending_payment → cancelled`, `paid → cancelled`) and confirm every invalid transition is rejected (e.g. `pending_payment → collected` directly, `collected → cancelled`, any transition out of `cancelled`); confirm a `→ cancelled` transition always triggers exactly one stock-ledger release call per line item, and that a repeat cancellation attempt on an already-cancelled order is a no-op rather than double-releasing stock.

Tests should exercise these modules through their own interface (function/class calls or in-process calls against the state machine and ledger), not through the HTTP layer or a real database where avoidable — they're testing business rules, not wiring. This is a new repo with no prior test suite to follow as precedent; the testing framework choice (e.g. `pytest`) should match whatever the FastAPI backend setup uses conventionally.

No automated tests are planned for this first pass on: catalog CRUD, order reference generation, file storage, admin auth, or notifications — these are either thin wrappers over the DB/storage/email provider or low-risk enough to verify manually before the sale goes live.

## Out of Scope

- Real online payment processing of any kind (cards, payment gateways) — payment is always verified manually by an admin against off-platform proof.
- Shipping/delivery — pickup only, no address collection, no shipping cost logic.
- Multiple concurrent sale events/seasons, or any historical "past season" browsing — one active catalog only.
- Camper/cabin fields or roster validation of any kind — the store sells merch to anyone, not just camp attendees, so there's no attendee/roster integration to `purpose-camp` or any other source.
- Customer accounts, login, or self-service order editing/cancellation.
- Admin roles/permission tiers, or in-app admin invite/self-service admin account creation — admins are seeded directly by the developer.
- Automatic expiry/cancellation of unpaid orders — stock stays reserved until an admin manually cancels.
- Automatic "paid" or "collected" notification emails — only the initial order-confirmation email is automatic; other updates are communicated manually by church staff for now (the notifications module is built so these can be added later without a rewrite).
- Any integration with, or shared infrastructure from, the `purpose-camp` app.

## Further Notes

- `purpose-camp` (the existing full mobile camp app) remains untouched and is a separate, unrelated concern. Its `storage_service.py` pattern (presigned upload/download URLs, dev-mode local fallback) is a useful reference for this project's file storage module, but should be reimplemented fresh here, not imported as a dependency.
- Because there's no automatic expiry, the admin order list's sort/filter-by-age (user story 20/36) is load-bearing for the whole "reserve on order" stock model to work in practice — without it, stale unpaid orders will silently lock up limited sizes and nobody will notice until someone complains. This should not be treated as a nice-to-have.
- Order line items should snapshot product name/variant/price at the time of order rather than referencing the live catalog by ID alone, so that later catalog edits (price changes, renames, deactivation) never alter the historical record of what a customer actually ordered and was charged.
