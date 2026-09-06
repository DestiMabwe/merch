Status: ready-for-agent

# Project scaffolding & walking skeleton

## Parent

.scratch/merch-ordering/PRD.md

## What to build

Set up the FastAPI backend and Next.js frontend skeletons in this repo, wired together end-to-end via a trivial health-check path, plus the relational database connection. This is the foundation every other slice builds on: backend app structure (routers, models, DB session), frontend app structure (pages/routing, API client), and a working local dev setup.

## Acceptance criteria

- [ ] FastAPI backend runs locally and exposes a `GET /health` endpoint returning a simple OK payload
- [ ] A relational database (SQLite for local dev, swappable to Postgres via env config) is connected, with a migration tool set up (e.g. Alembic) and at least one migration applied
- [ ] Next.js frontend runs locally and has a page that calls the backend's `/health` endpoint and displays the result, proving the frontend-backend connection works end-to-end
- [ ] Environment configuration (DB URL, API base URL, etc.) is read from env vars with a documented `.env.example`
- [ ] README documents how to run both frontend and backend locally

## Blocked by

None - can start immediately
