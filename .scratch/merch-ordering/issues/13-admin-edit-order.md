Status: ready-for-agent

# Admin edit order line items

## Parent

.scratch/merch-ordering/PRD.md

## What to build

Letting an admin correct an order's line items or quantities after submission (e.g. wrong size). There is no stock ledger to keep in sync — edits don't reserve, release, or otherwise touch any variant's stock count.

## Acceptance criteria

- [ ] From the order detail view, an admin can change a line item's variant and/or quantity, or remove a line item
- [ ] Edited line items continue to snapshot the (possibly new) product/variant name and price at edit time, per the same snapshot rule as order creation
- [ ] Order edits are only available to admins - there is no customer-facing edit path

## Blocked by

- 09-admin-order-queue-detail

## Comments

- Implemented 2026-09-08: `PATCH /admin/orders/{reference}/items/{item_id}`
  (body: `variant_id` and/or `quantity`, at least one required) and
  `DELETE /admin/orders/{reference}/items/{item_id}` added to
  `admin_orders.py`. Changing `variant_id` re-snapshots product_id,
  product_name, variant_size/color, and unit_price from the new variant
  (same snapshot rule as order creation); a quantity-only edit leaves the
  existing snapshot alone rather than silently re-pricing against the live
  catalog. No stock ledger involvement per the PRD - edits don't touch any
  variant's stock count. Frontend: each line item row on the order detail
  page is a `<select>` of that product's active sibling variants (fetched
  via the existing admin catalog endpoint) plus a quantity input, with
  Save (disabled until something's actually changed) and Remove buttons.
  No admin-only restriction based on order status was added since the ACs
  don't call for one. Verified manually via curl and in the browser:
  quantity-only edit, variant change re-pricing correctly, and removal.
- Follow-up 2026-09-09: a re-grill of issues 10-14 found that the missing
  status restriction was a real gap, not just an unstated AC - a
  `collected` order's line items could still be edited or deleted
  entirely (verified live: set quantity to 99, then deleted the item,
  leaving a real `collected` order with 0 items and R0 total). Added
  `_require_editable()` in `admin_orders.py`, gating both `PATCH` and
  `DELETE` on `.../items/{item_id}` to `pending_payment`, `paid`, and
  `ready_for_collection` (the same set that's cancellable) with a clear
  400 otherwise. Frontend now renders line items as plain read-only cells
  with a "this order is {status} — items can no longer be changed" note
  once an order leaves that set, instead of showing Save/Remove controls
  that would just fail. Verified live: edit/delete both correctly
  rejected once an order reaches `collected`, item left untouched.


