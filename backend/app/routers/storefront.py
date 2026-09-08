from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.models import Product

router = APIRouter(tags=["storefront"])


class PublicVariantOut(BaseModel):
    id: int
    size: str | None
    color: str | None
    price: int
    stock: int

    model_config = {"from_attributes": True}


class PublicProductOut(BaseModel):
    id: int
    name: str
    description: str | None
    photo_url: str | None
    variants: list[PublicVariantOut]


def _to_public_product(product: Product) -> PublicProductOut:
    return PublicProductOut(
        id=product.id,
        name=product.name,
        description=product.description,
        photo_url=product.photo_url,
        variants=[
            PublicVariantOut.model_validate(variant) for variant in product.variants if variant.active
        ],
    )


@router.get("/products", response_model=list[PublicProductOut])
def list_products(db: Session = Depends(get_db)) -> list[PublicProductOut]:
    products = (
        db.query(Product)
        .options(selectinload(Product.variants))
        .filter(Product.active.is_(True))
        .order_by(Product.id)
        .all()
    )
    return [_to_public_product(product) for product in products]


@router.get("/products/{product_id}", response_model=PublicProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)) -> PublicProductOut:
    product = (
        db.query(Product)
        .options(selectinload(Product.variants))
        .filter(Product.id == product_id, Product.active.is_(True))
        .first()
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return _to_public_product(product)
