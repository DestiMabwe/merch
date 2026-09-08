Status: ready-for-agent

# Admin auth & login

## Parent

.scratch/merch-ordering/PRD.md

## What to build

Seeded admin accounts and a login flow so admin staff can authenticate. Backend: an admin user model seeded via a script with developer-configured credentials (no self-signup), password hashing, a login endpoint issuing a session/JWT, and an auth-guard dependency protecting admin-only routes. Frontend: an admin login page and a protected admin shell that redirects unauthenticated visitors to login.

## Acceptance criteria

- [ ] A seed script creates one or more admin accounts from configured credentials (e.g. env vars or a seed file), with passwords stored hashed, never in plaintext
- [ ] `POST /admin/login` accepts email/username + password and returns a session token (JWT or equivalent) on success, and a clear auth error on failure
- [ ] All admin-only backend routes are protected by a shared auth-guard dependency that rejects unauthenticated or invalid-token requests
- [ ] All admin accounts have identical permissions - there is no role/tier distinction enforced anywhere
- [ ] Frontend has a login page; submitting valid credentials logs the admin in and lands them on a protected admin home page; invalid credentials show an error and do not grant access
- [ ] Visiting any admin page while logged out redirects to the login page

## Blocked by

- 01-project-scaffolding

## Comments

- Implemented 2026-09-08: `AdminUser` model + Alembic migration, `app/auth.py`
  (bcrypt hashing, JWT issue/verify, `get_current_admin` guard dependency),
  `app/routers/admin.py` (`POST /admin/login`, `GET /admin/me`), and
  `app/seed_admin.py` (idempotent seeding from `ADMIN_SEED_ACCOUNTS`) on the
  backend. Frontend adds `/admin/login` and a route-group-guarded `/admin`
  home page that stores the JWT in `localStorage` and sends it as a bearer
  token. Verified manually end-to-end (login success/failure, guarded
  redirect, reload persistence, logout) per the PRD's testing scope, which
  excludes admin auth from automated coverage.
