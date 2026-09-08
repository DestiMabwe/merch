# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Customers**: members of the Forward In Faith Ministries Int. congregation — all ages, not just camp attendees. Anyone in the community can order merch whether or not they're going to camp. No account/login; identified at checkout by name + contact (email and/or phone) only.
- **Admins**: church secretary and other seeded staff, all with equal permissions. Reconcile off-platform bank-transfer payments against orders, upload/verify proof of payment, mark orders collected at camp, manage the catalog.

## Product Purpose

Replace the church's plain Google Form for the annual camp merch sale with a real storefront experience — product browsing, cart, stock awareness — while keeping payment fully manual/off-platform (church protocol prohibits online payment processing). Success: customers can browse, order, get clear payment instructions, and check their order status without contacting the church directly; admins can reconcile payments and track fulfillment without overselling limited stock, without an automatic-expiry safety net.

## Positioning

Not a general commerce platform — a single-event, storefront-quality ordering experience purpose-built for one church community sale per year. It combines real e-commerce UX (variants, stock, cart) with a fully manual payment-verification workflow suited to a church that cannot process online payments.

## Operating Context

- One-off camp merch sale; no season/event concept — one active catalog at a time.
- Pickup only at camp — no shipping, no address collection.
- Payment happens off-platform via bank/EFT transfer, reconciled by hand against a bank statement using each order's short reference code.
- Stock is reserved the moment an order is placed and only released if an admin manually cancels — there is no automatic expiry of unpaid orders, so the admin order queue's age/status view is load-bearing, not a nice-to-have.

## Capabilities and Constraints

- No real online payment processing of any kind (cards, gateways) — verified manually by an admin against uploaded/attached proof.
- No camper/cabin or roster field — orders aren't tied to camp attendance; the store is open to the whole congregation.
- No customer accounts or self-service order editing/cancellation — customers look up status via order reference + email/phone; only admins edit or cancel.
- Admin accounts are seeded directly by the developer; no roles/tiers, no in-app admin invite flow.
- Only the initial order-confirmation email is automatic; "paid"/"collected" updates are communicated manually for now.
- Full detailed spec: `.scratch/merch-ordering/PRD.md` and its issue breakdown in `.scratch/merch-ordering/issues/`.

## Brand Commitments

- **Organization**: Forward In Faith Ministries Int. — tagline "Bound by the Spirit of God."
- **Existing institutional mark**: `church logo.png` (repo root) — circular emblem, cross, blue/red/silver metallic gradient. This is the church's standing trust mark, independent of any single year's camp theme.
- **This year's camp campaign identity — "Purpose Over Pressure"**: graffiti/spray-paint streetwear artwork (`Purpose Over Pressure.pdf`, repo root — 3 pages of product mockups: tee, crewneck sweatshirt, hoodie, front+back, all sharing one design). Black garment base; purple, magenta/pink, and white ink; drip/spray-paint lettering; crown and heart motifs; scripture reference Romans 8:28; tagline "He has a plan & I have a purpose."
- Two visual identities exist side by side: the timeless institutional emblem and this year's youth-coded campaign art. How they coexist on the site (e.g. small trust mark vs. hero campaign visual) is an open visual-world decision, not resolved here.
- Confirmed: despite the youth-streetwear design language of this year's drop, the audience is the whole congregation (all ages), not youth-exclusive — copy and tone should stay broadly welcoming rather than youth-targeted.
- Confirmed: this 3-item, one-design lineup (tee/sweat/hoodie, "Purpose Over Pressure") is the entire catalog for this sale — no other products or designs are planned before launch.

## Evidence on Hand

- Product mockups: `Purpose Over Pressure.pdf` (repo root) — the actual imagery to use for storefront product listings.
- Church emblem: `church logo.png` (repo root).
- Confirmed launch pricing: T-shirts R350, Sweats R500, Hoodies R650 (South African Rand).
- No testimonials, case studies, press, or other social proof exist — none should be fabricated.

## Product Principles

1. Feel like real e-commerce, function like a form — front-end polish (browsing, cart, stock), zero real payment processing or roster complexity on the back end.
2. One catalog, one campaign — the whole storefront exists to sell this single "Purpose Over Pressure" drop; don't design for multi-season/multi-drop complexity that doesn't exist yet.
3. Welcoming to the whole congregation — a parent, a grandparent, and a teenager should all feel this is "for them," even though the artwork itself is youth-coded streetwear.
4. Manual reconciliation is a feature, not a bug — the admin order queue (age/status visibility, proof upload) carries as much weight as the storefront, since nothing expires automatically.
5. Institutional trust + campaign energy — the site should carry Forward In Faith's credibility while letting this year's bold campaign art lead the sale's visual identity.
