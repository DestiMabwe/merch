"""Seed admin accounts from the ADMIN_SEED_ACCOUNTS env var.

Format: "email:password,email:password". Idempotent — rerunning updates the
password hash for accounts that already exist and creates any that don't.

Usage: uv run python -m app.seed_admin
"""

import os
import sys

from app.auth import hash_password
from app.db import SessionLocal
from app.models import AdminUser


def parse_accounts(raw: str) -> list[tuple[str, str]]:
    accounts = []
    for entry in raw.split(","):
        entry = entry.strip()
        if not entry:
            continue
        email, _, password = entry.partition(":")
        if not email or not password:
            raise ValueError(f"Malformed ADMIN_SEED_ACCOUNTS entry: {entry!r}")
        accounts.append((email.strip(), password))
    return accounts


def seed(accounts: list[tuple[str, str]]) -> None:
    db = SessionLocal()
    try:
        for email, password in accounts:
            admin = db.query(AdminUser).filter(AdminUser.email == email).first()
            if admin is None:
                admin = AdminUser(email=email)
                db.add(admin)
                print(f"Created admin: {email}")
            else:
                print(f"Updated admin: {email}")
            admin.password_hash = hash_password(password)
        db.commit()
    finally:
        db.close()


def main() -> None:
    raw = os.environ.get("ADMIN_SEED_ACCOUNTS", "")
    accounts = parse_accounts(raw)
    if not accounts:
        print("ADMIN_SEED_ACCOUNTS is empty — nothing to seed.", file=sys.stderr)
        sys.exit(1)
    seed(accounts)


if __name__ == "__main__":
    main()
