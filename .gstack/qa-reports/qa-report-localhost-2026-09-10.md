# QA Report — camp-merch-store (localhost:3000 / localhost:8000)

**Date:** 2026-09-10
**Mode:** Full (no diff scope — first /qa run on this project)
**Tier:** Standard (critical/high/medium fixed, low deferred)
**Tooling note:** the project's `$B` browse binary isn't built on this machine (missing Windows server bundle); testing was done with the equivalent Chrome DevTools browser tools instead. Same methodology: navigate, screenshot, read console, exercise real flows, verify via DOM/network inspection.

## Pre-flight: working tree

Found the entire session's accumulated feature work uncommitted (order lifecycle, admin order management, order tracking/timeline, storefront polish, catalog seeding, error-message clarity, logo fix — 35 files, ~1200 lines). Per the user's choice, committed it as 6 logical commits before starting QA, so every QA fix below lands as its own atomic commit on top of a clean base:

```
cc4790c Add admin order lifecycle management (issues 10-14)
e8d4442 Add order tracking, status timeline, and payment reference clarity
25a058a Polish storefront product picker and layout
8676bae Seed real catalog and surface real admin error messages
08dbee2 Update docs and issue tracker for shipped order-management work
53970f9 Crop church logo to remove padding around the circular mark
```

## Summary

| | |
|---|---|
| Pages/flows tested | Storefront home, product detail, cart, checkout, order tracking, admin login, dashboard, products list/detail, orders list/detail |
| Issues found | 3 |
| Fixed | 2 (1 high, 1 low) |
| Verified clean | sold-out variant state, stock race-condition at checkout, 404s (product + admin order/product), checkout validation, admin auth, console (no errors/warnings on any page) |
| Health score | 90 → 97 |

## Issues

### ISSUE-001 — Duplicate variant crashes with an opaque network error (High, fixed)

**What:** Creating (or updating) a product variant into an already-existing (product, size, color) combination hit the DB's unique constraint (`uq_variant_product_size_color` in `models.py`), which nothing caught. The exception propagated to Starlette's default unhandled-exception handler, which returns a 500 **without CORS headers**. Since the storefront and admin panel are a different origin (`localhost:3000` calling `localhost:8000`), the browser's CORS enforcement blocked the response entirely and surfaced it to the app as a bare `TypeError: Failed to fetch` — no status code, no message, nothing actionable.

**Repro:** In the admin product editor (`/admin/products/3`), use "Add variant" to re-submit a size/color that already exists (e.g. `M` / `White` on the Tee, which already exists). The form fails silently from the user's perspective — no error text renders because the failure never reaches the point of being a proper `CatalogError`.

**Evidence:**
- Raw curl (bypasses CORS, shows the true response): `HTTP/1.1 500 Internal Server Error`, body `Internal Server Error`, no `access-control-allow-origin` header.
- Browser `fetch` with identical payload: `TypeError: Failed to fetch`.
- Through the actual admin "Add variant" form: no error message displayed at all.

**Fix:** `backend/app/routers/catalog.py` — added `_commit_or_duplicate_variant_error()`, used by both `create_variant` and `update_variant`, that catches `IntegrityError` on commit, rolls back, and raises a normal `HTTPException(400, "A variant with that size and color already exists")`.

**Verified after fix:**
- curl: `HTTP/1.1 400 Bad Request`, `{"detail":"A variant with that size and color already exists"}`.
- Browser `fetch`: resolves normally with `status: 400` and the same body (no more CORS block, since a normal FastAPI response carries the middleware's CORS headers).
- Live admin form: submitting the duplicate now shows "A variant with that size and color already exists" inline (this also relies on this session's earlier `catalog.ts` fix, which made the admin catalog pages surface real backend error text instead of a generic fallback).

**Regression test:** not added. This test suite has no DB-backed API test fixtures yet (`test_health.py` and `test_order_lifecycle.py` are the only tests, and neither touches a database) — building that scaffolding from scratch is out of scope for a QA bug fix. Deferred per the skip allowance for regression tests that would need real exploration time.

**Commit:** `93b5acb`

### ISSUE-002 — Admin detail pages dead-end on load error (Low, fixed)

**What:** `/admin/orders/[reference]` and `/admin/products/[id]` both render only the bare error text (`"Order not found"` / `"Product not found"`) when the reference/id doesn't resolve, dropping the "← Orders" / "← Products" back link that the successful-load render shows directly above the title. Not a true dead end (the persistent top nav still has Orders/Products links), but inconsistent with every other not-found state in the app, all of which pair the message with an immediate way back (e.g. the customer-facing `/products/[id]` "Product not found" page).

**Repro:** Visit `/admin/orders/CM-DOESNOTEXIST` or `/admin/products/99999`.

**Fix:** Added the same back link used in the normal render to both error branches.

**Verified:** Both pages now show `← Orders` / `← Products` above the error text.

**Commit:** `f4653e0`

### ISSUE-003 — Cart quantity display goes stale relative to live stock (Informational, not fixed)

**What:** If stock for a variant already in someone's cart drops after they added it (another order takes the last units, or an admin adjusts stock), the cart and checkout pages keep showing the cart's cached quantity — there's no re-validation against live stock until the customer actually submits the order.

**Why not fixed:** This is by design, not a bug. The backend is the real source of truth and correctly rejects with a specific, actionable message at submit time (verified: `"Purpose Over Pressure Tee (M / White) doesn't have 3 left in stock"`), and the checkout page's own "← Back to cart" link is right there to fix it. Pre-emptively re-validating stock on every cart/checkout render would be a feature addition (live polling or refetch-on-mount), not a QA fix, for a single-event low-traffic sale where this race is rare. Noting for awareness, not fixing.

## Verified clean (no issues found)

- **Sold-out variant state**: temporarily zeroed a variant's stock via the admin API — the storefront chip correctly went `disabled`, `opacity: 0.4`, `line-through`, dimmed border, matching DESIGN.md's spec exactly. Reverted after.
- **Stock race condition at checkout**: see ISSUE-003 — backend correctly rejects with a specific message; not a bug.
- **404 handling**: customer product 404, admin order 404, admin product 404 all render clean, non-crashing states (two of the three lacked a back link — see ISSUE-002).
- **Checkout validation**: empty cart, missing contact info, and over-stock quantity all produce clear, specific error text.
- **Admin auth**: login/logout, protected-route redirect, and all four newly-seeded accounts (`supplier@merch.com`, `carol@merch.com`, `tadiwa@merch.com`, `destiny@merch.com`) verified working earlier this session.
- **Console**: zero errors or warnings (beyond expected dev-mode React DevTools/HMR notices) across storefront home, product detail, admin dashboard, admin products, admin orders.
- **Duplicate-constraint sweep**: checked every other `UniqueConstraint`/`unique=True` in the schema (`AdminUser.email`, `Order.reference`) — neither is reachable from an exposed endpoint in a way that could hit the same unhandled-crash pattern (no admin-creation endpoint exists; order references are generated with a collision-checked retry loop).

## Deferred (not in scope for this pass)

- ISSUE-003 (informational, no action needed).
- Full mobile-viewport visual sweep — this session already did extensive narrow-viewport verification of the checkout/tracking/timeline UI earlier (via direct DOM measurement, since the browser tool's `resize_window` has been unreliable in this environment); didn't re-run it as part of this pass.

## Health Score: 97/100

Console 100 · Links 100 · Functional 90 (one high-severity crash, now fixed) · UX 95 (one low-severity dead-end, now fixed) · Visual 100 · Performance/Accessibility/Content: not deeply audited this pass (would need a dedicated a11y/perf sweep — out of scope for a first QA pass focused on functional correctness).
