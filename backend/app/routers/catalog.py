from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.auth import get_current_admin
from app.db import get_db
from app.models import Product, Variant
from app.storage import get_storage

router = APIRouter(prefix="/admin/products", tags=["catalog"], dependencies=[Depends(get_current_admin)])


class VariantCreate(BaseModel):
    size: str | None = None
    color: str | None = None
    price: int
    stock: int = 0


class VariantUpdate(BaseModel):
    size: str | None = None
    color: str | None = None
    price: int | None = None
    stock: int | None = None
    active: bool | None = None


class VariantOut(BaseModel):
    id: int
    size: str | None
    color: str | None
    price: int
    stock: int
    active: bool

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    variants: list[VariantCreate] = Field(min_length=1)


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    active: bool | None = None


class ProductOut(BaseModel):
    id: int
    name: str
    description: str | None
    photo_url: str | None
    active: bool
    variants: list[VariantOut]

    model_config = {"from_attributes": True}


def _get_product_or_404(db: Session, product_id: int) -> Product:
    product = (
        db.query(Product)
        .options(selectinload(Product.variants))
        .filter(Product.id == product_id)
        .first()
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


def _get_variant_or_404(db: Session, product_id: int, variant_id: int) -> Variant:
    variant = (
        db.query(Variant)
        .filter(Variant.id == variant_id, Variant.product_id == product_id)
        .first()
    )
    if variant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    return variant


@router.get("", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)) -> list[Product]:
    return db.query(Product).options(selectinload(Product.variants)).order_by(Product.id).all()


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(body: ProductCreate, db: Session = Depends(get_db)) -> Product:
    product = Product(name=body.name, description=body.description)
    product.variants = [Variant(**variant.model_dump()) for variant in body.variants]
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)) -> Product:
    return _get_product_or_404(db, product_id)


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, body: ProductUpdate, db: Session = Depends(get_db)) -> Product:
    product = _get_product_or_404(db, product_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.post("/{product_id}/photo", response_model=ProductOut)
def upload_product_photo(
    product_id: int, photo: UploadFile = File(...), db: Session = Depends(get_db)
) -> Product:
    product = _get_product_or_404(db, product_id)

    if not (photo.content_type or "").startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image")

    product.photo_url = get_storage().save(photo, folder="products")
    db.commit()
    db.refresh(product)
    return product


def _commit_or_duplicate_variant_error(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A variant with that size and color already exists",
        )


@router.post("/{product_id}/variants", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_variant(product_id: int, body: VariantCreate, db: Session = Depends(get_db)) -> Product:
    product = _get_product_or_404(db, product_id)
    product.variants.append(Variant(**body.model_dump()))
    _commit_or_duplicate_variant_error(db)
    db.refresh(product)
    return product


@router.patch("/{product_id}/variants/{variant_id}", response_model=ProductOut)
def update_variant(
    product_id: int, variant_id: int, body: VariantUpdate, db: Session = Depends(get_db)
) -> Product:
    variant = _get_variant_or_404(db, product_id, variant_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(variant, field, value)
    _commit_or_duplicate_variant_error(db)
    return _get_product_or_404(db, product_id)
