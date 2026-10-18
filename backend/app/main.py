import os

from fastapi import Depends, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import get_db
from app.routers import admin, admin_orders, catalog, orders, storefront
from app.storage import S3_BUCKET, UPLOAD_DIR

app = FastAPI(title="Camp Merch Store API")

allowed_origins = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(admin_orders.router)
app.include_router(catalog.router)
app.include_router(orders.router)
app.include_router(storefront.router)

# Local-disk uploads only exist when object storage isn't configured. Vercel's
# filesystem is read-only, so creating the directory there would crash startup.
if not S3_BUCKET:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness: is the process up? Deliberately touches nothing else."""
    return {"status": "ok"}


@app.get("/health/ready")
def readiness(db: Session = Depends(get_db)) -> JSONResponse:
    """Readiness: can the API actually serve a request end to end?

    `/health` stays green whenever uvicorn is running, which is why the store
    could sit unusable for days while the keep-awake ping reported success —
    every database-backed route was failing. This checks the database too, and
    answers 503 when it can't be reached so a monitor can tell the difference.
    """
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unavailable", "database": "unavailable"},
        )
    return JSONResponse(content={"status": "ok", "database": "ok"})
