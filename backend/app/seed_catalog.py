"""Seed the launch catalog: tee/crewneck/hoodie, each in 5 colors x 5 sizes.

Idempotent — skips any product whose name already exists (so it won't
duplicate or clobber catalog edits made from the admin panel). Photos come
from backend/seed_assets/, extracted from the "Purpose Over Pressure.pdf"
mockup deck at the repo root.

Usage: uv run python -m app.seed_catalog
"""

import mimetypes
from pathlib import Path

from app.db import SessionLocal
from app.models import Product, Variant
from app.storage import get_storage

SEED_ASSETS_DIR = Path(__file__).resolve().parent.parent / "seed_assets"

COLORS = ["White", "Off-White", "Navy", "Black", "Light Grey"]
SIZES = ["S", "M", "L", "XL", "2XL"]
STOCK = 15

PRODUCTS = [
    {
        "name": "Purpose Over Pressure Tee",
        "description": (
            "Graffiti-style 'Purpose Over Pressure' print across the back, with "
            "'He has a plan & I have a purpose' on the front. Fundraiser merchandise "
            "for Forward In Faith Ministries Int."
        ),
        "price": 350,
        "photo": "tee.png",
    },
    {
        "name": "Purpose Over Pressure Crewneck",
        "description": (
            "Graffiti-style 'Purpose Over Pressure' print across the back, with "
            "'He has a plan & I have a purpose' on the front. Fundraiser merchandise "
            "for Forward In Faith Ministries Int."
        ),
        "price": 500,
        "photo": "crewneck.png",
    },
    {
        "name": "Purpose Over Pressure Hoodie",
        "description": (
            "Graffiti-style 'Purpose Over Pressure' print across the back, with "
            "'He has a plan & I have a purpose' on the front. Fundraiser merchandise "
            "for Forward In Faith Ministries Int."
        ),
        "price": 650,
        "photo": "hoodie.png",
    },
]


class _LocalFileUpload:
    """Minimal shim exposing the subset of FastAPI's UploadFile that
    FileStorage.save() needs, so seeding can go through the same storage
    abstraction (local disk or S3) as a real admin-uploaded photo."""

    def __init__(self, path: Path) -> None:
        self.filename = path.name
        self.content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        self.file = path.open("rb")


def _save_seed_photo(filename: str) -> str:
    source = SEED_ASSETS_DIR / filename
    upload = _LocalFileUpload(source)
    try:
        return get_storage().save(upload, folder="products")
    finally:
        upload.file.close()


def seed() -> None:
    db = SessionLocal()
    try:
        for spec in PRODUCTS:
            existing = db.query(Product).filter(Product.name == spec["name"]).first()
            if existing is not None:
                print(f"Skipped (already exists): {spec['name']}")
                continue

            product = Product(
                name=spec["name"],
                description=spec["description"],
                photo_url=_save_seed_photo(spec["photo"]),
            )
            product.variants = [
                Variant(size=size, color=color, price=spec["price"], stock=STOCK)
                for color in COLORS
                for size in SIZES
            ]
            db.add(product)
            print(f"Created: {spec['name']} ({len(product.variants)} variants)")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
