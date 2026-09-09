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

Backend on [Render](https://render.com), frontend on [Vercel](https://vercel.com). GitHub Pages can't host this project — it only serves static files, and both the FastAPI backend and the app's constantly-changing order/catalog data need a real running server.

### 1. Object storage (do this first)

Local-disk file storage (`app/storage.py`'s `LocalFileStorage`) only works for local dev — Render's disk is wiped on every deploy/restart, which would silently lose uploaded proof-of-payment screenshots and product photos. Create an S3-compatible bucket before deploying the backend:

1. Create a [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket (has a free tier; any S3-compatible provider works) and enable public access on it (or attach a custom domain) so uploaded files are viewable.
2. Create an API token/access key scoped to that bucket.
3. Note down: the bucket name, the S3-compatible endpoint URL, the access key ID/secret, and the bucket's public base URL — these become the `S3_*` env vars below.

### 2. Backend — Render

This repo includes `render.yaml` at the root, which defines the web service and a free Postgres database together (a [Render Blueprint](https://render.com/docs/blueprint-spec)):

1. In the Render dashboard: **New > Blueprint**, connect this GitHub repo, and apply it. Render provisions the Postgres database and the web service, and wires `DATABASE_URL` between them automatically.
2. Render will prompt for the env vars marked `sync: false` in `render.yaml` — fill in:
   - `CORS_ALLOWED_ORIGINS` — leave a placeholder for now (e.g. `http://localhost:3000`); come back and set it to the real Vercel URL after step 3.
   - `ADMIN_SEED_ACCOUNTS` — `email:password,email:password` for the real admin accounts. **Generate new passwords for production rather than reusing any shown earlier in chat history** — those were exposed in plaintext once already.
   - `S3_BUCKET`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` — from step 1.
3. The build command runs migrations (`alembic upgrade head`) and seeds admins (`app.seed_admin`) automatically on every deploy — both are idempotent, safe to rerun.
4. Once live, note the backend's `https://<name>.onrender.com` URL — the frontend needs it next.

Render's free web-service tier spins down after inactivity (a cold start takes a few seconds on the next request) and free Postgres instances typically expire after a fixed period — check Render's current free-tier terms and upgrade the plan if that's not acceptable for a live fundraiser.

### 3. Frontend — Vercel

1. In the Vercel dashboard: **New Project**, import this GitHub repo, set the project's root directory to `frontend/`. Vercel auto-detects Next.js — no other config needed.
2. Set the env var `NEXT_PUBLIC_API_BASE_URL` to the Render backend URL from step 2.4.
3. Deploy. Note the resulting `https://<project>.vercel.app` URL.

### 4. Wire CORS

Go back to the Render service's env vars and set `CORS_ALLOWED_ORIGINS` to the real Vercel URL from step 3 (comma-separated if there's more than one, e.g. a custom domain too), then trigger a redeploy so the backend picks it up.

### 5. Verify

- Visit the Vercel URL, confirm products load (storefront calls the Render backend).
- Log in at `/admin/login` with a seeded admin account, confirm the dashboard loads.
- Place a test order and upload a proof-of-payment file; confirm its URL points at the object storage bucket, not `onrender.com/uploads/...` (if it does, `S3_BUCKET` isn't set correctly and the backend fell back to local disk).
