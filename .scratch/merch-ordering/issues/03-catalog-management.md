Status: ready-for-agent

# Catalog management

## Parent

.scratch/merch-ordering/PRD.md

## What to build

The catalog data model (products with size/color variants) and full admin CRUD for it, including product photo uploads via a new file-storage module. This is the first consumer of file storage, built as a swappable abstraction (local-disk backend for now, S3/R2-compatible later) rather than tightly coupled upload code.

## Acceptance criteria

- [ ] Product model: name, description, photo URL, active flag
- [ ] Variant model: belongs to a product, defines a size/color combination, its own price, stock count, active flag
- [ ] File storage module exposes a simple "store file, get back a retrievable URL" interface with a local-disk implementation; product photo uploads go through this module
- [ ] Admin panel: list all products; create a new product with at least one variant; edit an existing product's details/photo; add/edit/remove variants on a product including stock counts; deactivate (not delete) a product or variant
- [ ] Deactivating a product/variant removes it from any public-facing listing (verified once 04-storefront-browsing exists) but does not delete its underlying data
- [ ] All catalog admin routes are protected by the admin auth guard from 02-admin-auth-login

## Blocked by

- 01-project-scaffolding
- 02-admin-auth-login
