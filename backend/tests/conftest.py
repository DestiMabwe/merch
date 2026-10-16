"""Test harness for API-level tests.

Everything here exists to keep a test off real infrastructure. Three module-level
globals in the app read their config at import time from `.env` (loaded by
`app.db`), so without these fixtures a test that posts to an upload endpoint
writes to the production R2 bucket, and any request that isn't overridden opens
the real `camp_merch_store.db`:

  - `app.db.engine`      -> overridden per-test with in-memory SQLite
  - `app.storage.S3_BUCKET` -> cleared, so `get_storage()` stays on local disk
  - `app.storage.UPLOAD_DIR` -> pointed at a tmp dir, so writes are throwaway

`JWT_SECRET_KEY` is set before `app.auth` is imported, because that module reads
it with `os.environ[...]` at import and raises KeyError if it's missing.
"""

import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-not-a-real-key")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.storage as storage_module
from app.auth import create_access_token, hash_password
from app.db import Base, get_db
from app.main import app
from app.models import AdminUser, Product, Variant
from app.notifications import Notifier


@pytest.fixture
def db_session(tmp_path, monkeypatch):
    """A fresh in-memory database per test, with file storage sent to tmp_path.

    StaticPool keeps every connection on the same in-memory database, so the
    session a test writes through and the one the API reads through agree.
    """
    monkeypatch.setattr(storage_module, "S3_BUCKET", None)
    monkeypatch.setattr(storage_module, "UPLOAD_DIR", tmp_path / "uploads")

    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


class RecordingNotifier(Notifier):
    """Captures confirmations instead of sending them, so a test can assert on
    what a customer would have received."""

    def __init__(self) -> None:
        self.confirmations = []

    def send_order_confirmation(self, order) -> None:
        self.confirmations.append(order.reference)


@pytest.fixture
def notifier(monkeypatch):
    recording = RecordingNotifier()
    monkeypatch.setattr("app.routers.orders.get_notifier", lambda: recording)
    return recording


@pytest.fixture
def client(db_session, notifier):
    """A TestClient wired to the isolated database.

    Routes share the test's own session, so a change the test makes is visible
    to the request without a commit dance, and vice versa.
    """

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def admin(db_session) -> AdminUser:
    record = AdminUser(email="secretary@example.com", password_hash=hash_password("pw"))
    db_session.add(record)
    db_session.commit()
    return record


@pytest.fixture
def auth_headers(admin) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(admin.id)}"}


@pytest.fixture
def make_product(db_session):
    """Build a product with variants. Defaults to one in-stock variant, so a
    test only spells out the attributes its behaviour actually depends on."""

    def build(
        name: str = "Purpose Tee",
        *,
        active: bool = True,
        variants: list[dict] | None = None,
    ) -> Product:
        product = Product(name=name, active=active)
        product.variants = [
            Variant(
                size=spec.get("size", "M"),
                color=spec.get("color", "Black"),
                price=spec.get("price", 350),
                stock=spec.get("stock", 10),
                active=spec.get("active", True),
            )
            for spec in (variants or [{}])
        ]
        db_session.add(product)
        db_session.commit()
        return product

    return build
