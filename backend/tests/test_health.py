from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import get_db
from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_reports_ok_when_the_database_answers(client):
    response = client.get("/health/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def _break_the_database() -> None:
    """Point the app at a database it cannot open, the way a deleted or expired
    managed Postgres instance looks from the application's side."""
    unreachable = create_engine("sqlite:////nonexistent-directory/missing.db")
    broken_session = sessionmaker(bind=unreachable)()

    def override_get_db():
        yield broken_session

    app.dependency_overrides[get_db] = override_get_db


def test_readiness_reports_unavailable_when_the_database_is_unreachable(client):
    """The production failure this endpoint exists for: uvicorn is serving, but
    the database is gone, so every catalog and admin route is returning 500."""
    _break_the_database()

    response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json() == {"status": "unavailable", "database": "unavailable"}


def test_liveness_stays_green_even_when_the_database_is_unreachable(client):
    """Liveness and readiness answer different questions — a dead database must
    not make the platform think the process needs restarting."""
    _break_the_database()

    assert client.get("/health").status_code == 200
