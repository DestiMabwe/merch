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
