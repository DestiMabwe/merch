# camp-merch-store

A standalone storefront for the camp merch sale. See `.scratch/merch-ordering/PRD.md` for the full product spec.

## Stack

- **Backend**: FastAPI + SQLAlchemy + Alembic, managed with [uv](https://docs.astral.sh/uv/)
- **Frontend**: Next.js, managed with [Bun](https://bun.sh)

## Backend

```
cd backend
cp .env.example .env
uv run alembic upgrade head
uv run python -m app.seed_admin
uv run python -m app.seed_catalog
uv run uvicorn app.main:app --reload --port 8000
```

Runs at http://localhost:8000. `GET /health` returns `{"status": "ok"}`.

`app.seed_admin` creates/updates admin accounts from `ADMIN_SEED_ACCOUNTS` in
`.env` (format `email:password,email:password`) — rerun it any time to add
staff or reset a password. Admin login is `POST /admin/login` (returns a
bearer token), and `GET /admin/me` is a protected example route that any
future admin-only endpoint should depend on the same way (see
`app/auth.py`'s `get_current_admin`).

`app.seed_catalog` creates the launch catalog (tee/crewneck/hoodie, each in
5 colors x 5 sizes) if it doesn't already exist by name — safe to rerun,
it skips products that are already there rather than duplicating or
overwriting catalog edits. Photos come from `backend/seed_assets/`,
cropped from the "Purpose Over Pressure.pdf" mockup deck at the repo root.

Catalog CRUD lives under `/admin/products` (list/create/get/patch, plus
`/{id}/photo` for a multipart image upload and `/{id}/variants` for
variants) — all protected by the same admin guard. Product photos go
through `app/storage.py`'s `FileStorage` abstraction; the local-disk
implementation writes to `UPLOAD_DIR` (default `uploads/`, gitignored) and
serves them back from this API at `/uploads/...`.

The public storefront reads from `GET /products` and `GET /products/{id}`
(no auth) — these only ever return active products with active variants;
a deactivated product's detail route 404s even by direct id.

`POST /orders` is the public checkout endpoint (name + email/phone + cart
line items) — it validates each variant's current stock as a plain
snapshot check (no reservation/locking; stock is a manual, admin-edited
field, since the print/fulfillment provider owns real production
capacity), then creates the order and fires an order-confirmation
notification (`app/notifications.py`; prints to the console unless
`SMTP_HOST` is configured). `GET /orders/lookup` and
`POST /orders/{reference}/proof` back the customer self-service page,
both requiring the order's reference plus the matching customer name
(case/whitespace-insensitive). `GET/POST /admin/orders...` gives admins
the same data behind the auth guard, for triage and reconciliation.

Run tests: `uv run pytest`

## Frontend

```
cd frontend
cp .env.example .env
bun install
bun run dev
```

Runs at http://localhost:3000. The storefront home page (`/`) shows a grid
of active products from the catalog, each linking to a detail page
(`/products/[id]`) with a variant picker that disables sold-out sizes and
an Add to Cart control capped at current stock. `/cart` and `/checkout`
hold the localStorage-backed cart and the checkout form; a successful
order lands on a confirmation view with a copyable order number, a
status timeline, and banking details (including the EFT payment
reference, which is the customer's name rather than the order number).
`/orders` is the public self-service lookup (order number + name) with
an upload field for proof of payment.

The admin panel lives at `/admin/login`; `/admin` is a protected route that
redirects there if you're not logged in. Product catalog management is at
`/admin/products`, and the order queue/detail view is at `/admin/orders`.

Run tests: `bun test`

## Running both together

Start the backend first (frontend's home page calls it on load), then the frontend, each in its own terminal, using the commands above.

## Deployment

Both halves run on [Vercel](https://vercel.com) as two projects in the `merch6` team; the database is [Neon](https://neon.tech) Postgres, provisioned through the Vercel Marketplace. GitHub Pages can't host this project — it only serves static files, and both the FastAPI backend and the app's constantly-changing order/catalog data need a real running server.

| Part | Vercel project | URL |
|---|---|---|
| Frontend (Next.js) | `purpose-over-pressure`, root dir `frontend/` | https://purpose-ove-pressure.vercel.app |
| Backend (FastAPI) | `camp-merch-backend`, deployed from `backend/` | https://camp-merch-backend.vercel.app |
| Database | Neon `camp-merch-db` (Frankfurt), connected to `camp-merch-backend` | — |

The backend previously ran on Render; it moved off after Render's free Postgres expired and suspended the database (October 2026).

### Object storage

Vercel's filesystem is read-only, so uploads (proof-of-payment screenshots, product photos) go to a Cloudflare R2 bucket via the `S3_*` env vars. Local-disk storage (`app/storage.py`'s `LocalFileStorage`) is for local dev only, and the `/uploads` mount is skipped whenever `S3_BUCKET` is set.

### Backend — `camp-merch-backend`

- `backend/vercel.json` sets the FastAPI preset and pins functions to `fra1`, next to the Neon database.
- Env vars (Production): `DATABASE_URL` (+ `DATABASE_URL_UNPOOLED` etc., injected by the Neon integration), `JWT_SECRET_KEY`, `JWT_EXPIRE_MINUTES`, `CORS_ALLOWED_ORIGINS`, `NOTIFICATIONS_FROM_EMAIL`, and the five `S3_*` keys.
- Deploys from GitHub (`DestiMabwe/merch`, root directory `backend/`): a push to `main` deploys production; other branches get preview deploys. Previews have no database settings (Neon is connected to Production only), so expect database routes to fail there.
- **Migrations and seeds don't run on deploy.** Run them from your machine against the *direct* Neon connection whenever a new Alembic migration lands (all are idempotent):

  ```bash
  cd backend
  DATABASE_URL="<DATABASE_URL_UNPOOLED from Vercel → Storage → camp-merch-db>" uv run alembic upgrade head
  # first-time / new admins:
  DATABASE_URL="..." ADMIN_SEED_ACCOUNTS="email:password" uv run python -m app.seed_admin
  ```

  Vercel marks the Neon URLs Sensitive, so `vercel env pull` only yields `[Sensitive]` — copy the value from the Storage page instead.

### Frontend — `purpose-over-pressure`

- `NEXT_PUBLIC_API_BASE_URL=https://camp-merch-backend.vercel.app` (Production and Preview). It's inlined at build time, so redeploy the frontend after changing it.
- Add any new frontend domain to the backend's `CORS_ALLOWED_ORIGINS` and redeploy the backend.

### Monitoring

`.github/workflows/keep-backend-awake.yml` hits `/health/ready` hourly; it checks the database too, so the job goes red if the backend can't reach Neon. It's hourly rather than every few minutes so it doesn't keep Neon's compute awake around the clock and burn the free plan's compute hours.

### Verify

- Visit the frontend URL, confirm products load.
- Log in at `/admin/login` with a seeded admin account, confirm the dashboard loads.
- Place a test order and upload a proof-of-payment file; confirm its URL points at the R2 bucket.
