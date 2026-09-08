Status: ready-for-agent

# Public storefront browsing

## Parent

.scratch/merch-ordering/PRD.md

## What to build

The public, unauthenticated storefront pages that let customers browse the catalog created in 03-catalog-management - a product grid and a product detail page with variant (size/color) selection, showing live stock/sold-out state per variant.

## Acceptance criteria

- [ ] Public `GET` endpoint(s) return only active products/variants with their stock counts (no admin auth required)
- [ ] Storefront home page shows a grid of active products with photo, name, and price
- [ ] Clicking a product opens a detail page showing its variants; a variant with zero stock is clearly marked sold out and cannot be selected
- [ ] Deactivated products/variants never appear on these public pages
- [ ] Pages are usable on mobile-width viewports (this is meant to feel like a storefront, not a form)

## Blocked by

- 03-catalog-management

## Comments

- Implemented 2026-09-08: `app/routers/storefront.py` adds public
  `GET /products` and `GET /products/{id}` (no auth dependency) — both
  filter to active products and, within them, active variants only; the
  detail route 404s for a deactivated or missing product id, not just
  omits it from the list. Frontend: `src/app/page.tsx` now fetches real
  products instead of the old hardcoded mock and renders them as the
  existing graffiti gallery cards (photo/name/price), each linking to a
  new `src/app/products/[id]/page.tsx` detail page with a variant picker
  reusing the `.sizeChip` styling — zero-stock variants render
  struck-through, `disabled`, and unselectable. The old "pin to cart"
  placeholder UI (and its tests) was removed since it wasn't a real
  feature; issue 05 builds the actual cart. Verified manually via curl
  (active/inactive filtering, 404 on a deactivated product) and in the
  browser (grid, detail page, sold-out disabling, mobile width), plus new
  `bun test` coverage for the grid rendering and the sold-out-cannot-be-
  selected behavior specifically.
