Status: ready-for-agent

# Merch Ordering Tool

## Problem Statement

The church runs a camp merch sale (hoodies, tees, caps, etc.) every year. Today this is handled with a plain Google Form, which works for collecting orders but feels nothing like a store — there's no product browsing, no cart, no per-variant stock awareness, and no structured way for the secretary or other admin staff to confirm that a specific order's payment has actually come in (the church cannot process real payments online, for church-protocol reasons, so payment happens off-platform via bank transfer and has to be reconciled by hand).

A previous attempt to solve this ballooned into a full mobile-first camp app (`purpose-camp`) with authentication, chat, challenges, a schedule, and a Bible-verse feature — none of which this problem needs. That app stays as-is, untouched, and is not part of this effort. This PRD scopes a new, standalone project that does only what's needed: a storefront that feels like e-commerce on the front end, backed by a simple order-collection-and-verification system on the back end.

## Solution

Build `camp-merch-store` as its own small, standalone full-stack project (Next.js frontend + FastAPI backend + relational DB), decoupled from `purpose-camp` entirely — no shared auth, no shared database, no roster integration.

- **Public storefront** (no customer login required, same as a Google Form): customers browse a small catalog of products with size/color variants, add items to a cart, and check out by providing their name and contact details. The store is open to anyone ordering merch, not just campers attending — there is no camper/cabin or attendee field.
- **No real payment processing**: at the end of checkout, the customer sees the church's static bank/EFT details and a unique order reference to use as their payment description. They may optionally upload a proof-of-payment screenshot immediately, or do so later.
- **Stock awareness (manual, informational only)**: each variant has a stock count, but it is not a real-time inventory ledger — the actual merch is print-on-demand and production capacity is managed entirely by the external print/fulfillment provider, not this system. An admin sets/edits the stock count by hand (e.g. after checking with the provider) purely to control what shows as sold-out on the storefront. Placing, editing, or cancelling an order never automatically changes any stock count.
- **Admin panel** (seeded, fixed list of admin accounts — the secretary and any other staff you add — all with equal permissions): view the order queue, open an order to see any uploaded proof, tick off "payment received" (uploading proof on the customer's behalf if none was provided at checkout, or replacing it), mark an order "ready for collection" once the provider has printed it, mark it "collected" once the customer has physically picked it up, and edit or cancel orders as needed. Admins also fully manage the product catalog (create/edit/deactivate products and variants, manually set stock, upload photos).
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
9. As a customer, I want to see a unique order reference number after checkout, so that I can quote it in my bank transfer and use it to look up my order later.
10. As a customer, I want to see the church's bank/EFT details clearly at the end of checkout, so that I know exactly how and where to pay.
11. As a customer, I want to optionally upload a screenshot/photo of my proof of payment at checkout, so that I don't have to send it through a separate channel.
12. As a customer, I want to receive an order confirmation email summarizing my order, reference number, and payment instructions, so that I have a record I can refer back to.
13. As a customer, if I don't have an email address handy, I want checkout to still work with just a phone number, so that I'm not blocked from ordering.

### Post-checkout / self-service
14. As a customer, I want to look up my order's status later using my order reference plus my email or phone, so that I can check whether my payment has been confirmed without contacting the church.
15. As a customer, I want to upload my proof of payment after checkout (if I didn't do it at checkout time), so that I can still get my payment verified without needing to contact an admin directly.
16. As a customer, I want to see whether my order is Pending Payment, Paid, Ready for Collection, or Collected when I look it up, so that I know what to do next (e.g. come pick it up).

### Admin — order management
17. As an admin, I want to log in with a seeded admin account, so that only authorized church staff can access order and payment data.
18. As an admin, I want to see a list of all orders with their status, in an easy-to-read queue, so that I can triage what needs attention at a glance.
19. As an admin, I want to filter/sort orders by status and by how long they've been pending, so that I can spot stale unpaid orders and follow up.
20. As an admin, I want to open an individual order and see its full details (items, customer info, reference, any uploaded proof), so that I have everything needed to verify payment.
21. As an admin, I want to tick "payment received" on an order, so that its status moves to Paid and the customer/order record reflects that.
22. As an admin, I want to upload a proof-of-payment file to an order myself, so that I can attach evidence even when the customer paid via a channel outside the platform (cash, WhatsApp, in person).
23. As an admin, I want to replace an existing proof-of-payment file on an order, so that I can correct a wrong or unclear upload.
24. As an admin, I want to mark a paid order as "Ready for Collection" once the print/fulfillment provider has produced it, so that I know it's waiting at camp for the customer.
25. As an admin, I want to mark an order as "Collected" once the customer has physically picked up their merch, so that I can track who still needs to collect, distinct from orders that are merely ready and waiting.
26. As an admin, I want to edit an order's line items or quantities, so that I can fix a mistake (e.g. wrong size) without forcing the customer to reorder.
27. As an admin, I want to cancel an order, so that I can clear it out when it's abandoned, unpaid indefinitely, or a duplicate.

### Admin — catalog management
28. As an admin, I want to create a new product with a name, description, price, and photo, so that it appears in the storefront.
29. As an admin, I want to define size/color variants for a product with independent stock counts, so that I can flag specific sizes/colors as sold out on the storefront.
30. As an admin, I want to edit a product's details, price, or photo, so that I can correct or update listings without recreating them.
31. As an admin, I want to deactivate a product or variant (hide it from the storefront) without deleting its order history, so that discontinued items disappear from new orders but past orders remain intact.
32. As an admin, I want to manually adjust a variant's stock count, so that I can mark it sold out or available again based on what the print/fulfillment provider tells me.

### Cross-cutting / edge cases
33. As an admin, I want order references to be unique and human-readable (short, easy to read back over the phone or write on a form), so that reconciling payments against bank statements is practical.
34. As a customer, I want the system to prevent me from adding more of a variant to my cart than its current (admin-set) stock count allows, so that I don't submit an order for a size that's marked sold out.
35. As an admin, I want to see which orders are unpaid and how old they are, so that I can decide when to follow up or cancel a stale order.
36. As a customer, I want checkout to fail clearly and tell me why (e.g. "this size is sold out") if a variant's stock count no longer covers my cart by the time I submit, so that I'm not confused by a silent failure.

## Implementation Decisions

- **Project structure**: standalone repo (`camp-merch-store`), fully decoupled from `purpose-camp` — no shared database, auth, or user/roster data. Orders are not tied to a camper or cabin — anyone can place an order regardless of whether they're attending camp.
- **Stack**: Next.js frontend, FastAPI backend, a relational database (Postgres or SQLite — pick SQLite for local dev simplicity, Postgres for anything resembling production). No MongoDB, no Motor — orders/products/variants are relational data (products → variants → order line items), which fits a relational model better than the document store `purpose-camp` used.
- **No customer authentication**: the storefront and checkout are fully public. There is no customer account system, session, or JWT for shoppers.
- **Admin authentication**: a simple session or JWT-based login against a small, fixed, developer-seeded list of admin accounts. All admin accounts have identical permissions — there is no tiered role system (no "secretary vs. staff" distinction in permissions).
- **Catalog module**: `Product` (name, description, photo, active flag) has many `Variant`s (size/color combination, price, stock count, active flag). Deactivating a product/variant hides it from the public storefront but does not delete or alter historical order line items referencing it (line items should snapshot the product name/variant/price at order time so catalog edits never retroactively alter past orders).
- **Stock is manual and informational, not a ledger**: merch is print-on-demand — the external print/fulfillment provider owns real production capacity, not this system. A variant's stock count is just an admin-editable number used to compute a sold-out flag on the storefront and cap cart quantity; nothing about placing, editing, or cancelling an order reads or writes it automatically. There is no reservation, no atomic decrement, no concurrency handling, and no release-on-cancel — that entire ledger concept from earlier drafts of this PRD is out.
- **Order lifecycle module**: an explicit state machine with states `pending_payment → paid → ready_for_collection → collected`, plus a `cancelled` state reachable from `pending_payment`, `paid`, or `ready_for_collection` (not from `collected`). Transitions are validated (e.g. `ready_for_collection` is only reachable from `paid`; `collected` is only reachable from `ready_for_collection`). No automatic time-based transition exists — orders stay in `pending_payment` indefinitely until an admin acts, and cancelling never touches stock.
- **Order reference generator**: produces a short, unique, human-readable reference per order (e.g. a prefixed sequential or short random code), independent of the numeric database ID, used both in customer-facing payment instructions and admin-side reconciliation/search.
- **File storage module**: an abstraction over "store a file, get back a retrievable URL," used for both proof-of-payment uploads and product photos. Should support a local-disk backend for development and be swappable for an S3-compatible backend (mirroring the `storage_service.py` pattern from `purpose-camp`) without changing calling code, since hosting/storage provider is not yet decided.
- **Proof-of-payment attachment**: an order can have at most one current proof-of-payment file at a time. Customers may attach one at checkout or afterward via the self-service lookup page (while the order is not yet cancelled); admins may attach or replace it at any time from the admin panel. Replacing a file does not preserve the previous version.
- **Notifications module**: a single notification today — the order-confirmation email sent immediately after checkout, containing the order summary, reference number, and payment instructions. Built behind a generic "send order notification" interface so that a future "paid" or "collected" email is an additive call, not a rewrite.
- **Order editing**: only admins can edit line items/quantities or cancel an order after submission. Customers cannot self-edit or self-cancel; if a customer needs a change, they contact the church and an admin makes it.
- **Fulfillment**: pickup-only. No address field, no delivery option, no shipping cost calculation anywhere in the checkout flow.
- **Single active catalog**: no season/event/sale-cycle concept in the data model. If reused for a future camp, the catalog and stale orders would need manual archiving/reset — this is explicitly not built for now.
- **Hosting**: not decided. Backend and frontend should be built host-agnostic (standard FastAPI + SQL DB + env-configured file storage) rather than coupled to a specific provider's SDK/features.

## Testing Decisions

Automated tests are scoped to the one module carrying real correctness risk — logic bugs elsewhere are cheaper to catch by hand at this project's size, but a state machine is exactly the kind of thing that looks fine until a specific edge case hits production during a real sale:

- **Order lifecycle**: test every valid state transition (`pending_payment → paid`, `paid → ready_for_collection`, `ready_for_collection → collected`, `pending_payment → cancelled`, `paid → cancelled`, `ready_for_collection → cancelled`) and confirm every invalid transition is rejected (e.g. `pending_payment → ready_for_collection` or `pending_payment → collected` directly, `paid → collected` skipping `ready_for_collection`, `collected → cancelled`, any transition out of `cancelled`); confirm a repeat transition attempt (e.g. cancelling an already-cancelled order) is a no-op/clear rejection rather than silently succeeding twice.

Tests should exercise this module through its own interface (function/class calls against the state machine), not through the HTTP layer or a real database where avoidable — they're testing business rules, not wiring. This is a new repo with no prior test suite to follow as precedent; the testing framework choice (e.g. `pytest`) should match whatever the FastAPI backend setup uses conventionally.

No automated tests are planned for this first pass on: catalog CRUD, stock count edits, order reference generation, file storage, admin auth, or notifications — these are either thin wrappers over the DB/storage/email provider or low-risk enough to verify manually before the sale goes live.

## Out of Scope

- Real online payment processing of any kind (cards, payment gateways) — payment is always verified manually by an admin against off-platform proof.
- Shipping/delivery — pickup only, no address collection, no shipping cost logic.
- Multiple concurrent sale events/seasons, or any historical "past season" browsing — one active catalog only.
- Camper/cabin fields or roster validation of any kind — the store sells merch to anyone, not just camp attendees, so there's no attendee/roster integration to `purpose-camp` or any other source.
- Customer accounts, login, or self-service order editing/cancellation.
- Admin roles/permission tiers, or in-app admin invite/self-service admin account creation — admins are seeded directly by the developer.
- Automatic expiry/cancellation of unpaid orders — they stay in `pending_payment` indefinitely until an admin manually cancels.
- Real-time or concurrency-safe stock/inventory management — stock counts are a manual, admin-edited, informational field only, not a reservation ledger; actual production capacity is owned by the external print/fulfillment provider.
- Automatic "paid" or "collected" notification emails — only the initial order-confirmation email is automatic; other updates are communicated manually by church staff for now (the notifications module is built so these can be added later without a rewrite).
- Any integration with, or shared infrastructure from, the `purpose-camp` app.

## Further Notes

- `purpose-camp` (the existing full mobile camp app) remains untouched and is a separate, unrelated concern. Its `storage_service.py` pattern (presigned upload/download URLs, dev-mode local fallback) is a useful reference for this project's file storage module, but should be reimplemented fresh here, not imported as a dependency.
- Because there's no automatic expiry, the admin order list's sort/filter-by-age (user story 19/35) is what keeps stale unpaid orders from being quietly forgotten — without it, nobody notices an unpaid order until the customer chases it up. This should not be treated as a nice-to-have.
- Order line items should snapshot product name/variant/price at the time of order rather than referencing the live catalog by ID alone, so that later catalog edits (price changes, renames, deactivation) never alter the historical record of what a customer actually ordered and was charged.
