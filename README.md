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
uv run uvicorn app.main:app --reload --port 8000
```

Runs at http://localhost:8000. `GET /health` returns `{"status": "ok"}`.

`app.seed_admin` creates/updates admin accounts from `ADMIN_SEED_ACCOUNTS` in
`.env` (format `email:password,email:password`) — rerun it any time to add
staff or reset a password. Admin login is `POST /admin/login` (returns a
bearer token), and `GET /admin/me` is a protected example route that any
future admin-only endpoint should depend on the same way (see
`app/auth.py`'s `get_current_admin`).

Catalog CRUD lives under `/admin/products` (list/create/get/patch, plus
`/{id}/photo` for a multipart image upload and `/{id}/variants` for
variants) — all protected by the same admin guard. Product photos go
through `app/storage.py`'s `FileStorage` abstraction; the local-disk
implementation writes to `UPLOAD_DIR` (default `uploads/`, gitignored) and
serves them back from this API at `/uploads/...`.

The public storefront reads from `GET /products` and `GET /products/{id}`
(no auth) — these only ever return active products with active variants;
a deactivated product's detail route 404s even by direct id.

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
(`/products/[id]`) with a variant picker that disables sold-out sizes.
The admin panel lives at `/admin/login`; `/admin` is a protected route that
redirects there if you're not logged in. Product catalog management is at
`/admin/products`.

Run tests: `bun test`

## Running both together

Start the backend first (frontend's home page calls it on load), then the frontend, each in its own terminal, using the commands above.
