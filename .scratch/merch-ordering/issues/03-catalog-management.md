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

## Comments

- Implemented 2026-09-08: `Product`/`Variant` models + Alembic migration
  (variants have their own price/stock/active, unique on
  product_id+size+color). `app/storage.py` adds the `FileStorage`
  abstraction (`LocalFileStorage` writing to `UPLOAD_DIR`, served at
  `/uploads/...`, swappable later for S3). `app/routers/catalog.py` adds
  `/admin/products` CRUD (list/create/get/patch, photo upload, variant
  create/patch) all gated by the existing `get_current_admin` dependency —
  no route bypasses it. Deactivation is a boolean field via PATCH, not a
  delete endpoint, on both products and variants; there is no delete
  endpoint anywhere. Frontend adds `/admin/products` (list),
  `/admin/products/new` (create with at least one variant row), and
  `/admin/products/[id]` (edit details, upload/preview photo, edit
  variants inline, add a variant) under the existing `(protected)` route
  group. Verified manually end-to-end (curl for every endpoint including
  the 401-without-token case, then the same flows through the browser UI)
  per the PRD's testing scope, which excludes catalog CRUD and file
  storage from automated coverage, same as admin auth.
