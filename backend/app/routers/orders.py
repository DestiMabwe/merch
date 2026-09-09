import re
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.models import Order, OrderLineItem, Variant
from app.notifications import get_notifier
from app.order_reference import generate_order_reference
from app.storage import get_storage

router = APIRouter(prefix="/orders", tags=["orders"])

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class CheckoutLineItem(BaseModel):
    variant_id: int
    quantity: int = Field(gt=0)


class CheckoutRequest(BaseModel):
    customer_name: str = Field(min_length=1)
    customer_email: str | None = None
    customer_phone: str | None = None
    items: list[CheckoutLineItem] = Field(min_length=1)

    @model_validator(mode="after")
    def _require_contact_and_valid_email(self) -> "CheckoutRequest":
        if not self.customer_email and not self.customer_phone:
            raise ValueError("Provide an email or phone number")
        if self.customer_email and not _EMAIL_RE.match(self.customer_email):
            raise ValueError("Invalid email address")
        return self


class OrderLineItemOut(BaseModel):
    product_name: str
    variant_size: str | None
    variant_color: str | None
    unit_price: int
    quantity: int

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    reference: str
    customer_name: str
    customer_email: str | None
    customer_phone: str | None
    status: str
    proof_of_payment_url: str | None
    created_at: datetime
    items: list[OrderLineItemOut]
    total: int


def _variant_label(variant: Variant) -> str:
    parts = [part for part in (variant.size, variant.color) if part]
    return " / ".join(parts) if parts else "this item"


def _to_order_out(order: Order) -> OrderOut:
    items = [OrderLineItemOut.model_validate(item) for item in order.items]
    return OrderOut(
        reference=order.reference,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        status=order.status,
        proof_of_payment_url=order.proof_of_payment_url,
        created_at=order.created_at,
        items=items,
        total=sum(item.unit_price * item.quantity for item in items),
    )


def _normalize_name(name: str) -> str:
    return " ".join(name.strip().lower().split())


def _name_matches(order: Order, name: str) -> bool:
    return _normalize_name(name) == _normalize_name(order.customer_name)


def _get_order_by_reference_or_404(db: Session, reference: str) -> Order:
    order = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.reference == reference)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def checkout(body: CheckoutRequest, db: Session = Depends(get_db)) -> OrderOut:
    variant_ids = {item.variant_id for item in body.items}
    variants = (
        db.query(Variant)
        .options(selectinload(Variant.product))
        .filter(Variant.id.in_(variant_ids))
        .all()
    )
    variants_by_id = {variant.id: variant for variant in variants}

    requested_quantity: dict[int, int] = {}
    for item in body.items:
        requested_quantity[item.variant_id] = (
            requested_quantity.get(item.variant_id, 0) + item.quantity
        )

    for variant_id, quantity in requested_quantity.items():
        variant = variants_by_id.get(variant_id)
        if variant is None or not variant.active or not variant.product.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One of the items in your cart is no longer available",
            )
        if quantity > variant.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{variant.product.name} ({_variant_label(variant)}) doesn't have "
                f"{quantity} left in stock",
            )

    order = Order(
        reference=generate_order_reference(db),
        customer_name=body.customer_name,
        customer_email=body.customer_email,
        customer_phone=body.customer_phone,
        status="pending_payment",
    )
    for item in body.items:
        variant = variants_by_id[item.variant_id]
        order.items.append(
            OrderLineItem(
                product_id=variant.product_id,
                variant_id=variant.id,
                product_name=variant.product.name,
                variant_size=variant.size,
                variant_color=variant.color,
                unit_price=variant.price,
                quantity=item.quantity,
            )
        )

    db.add(order)
    db.commit()
    db.refresh(order)

    try:
        get_notifier().send_order_confirmation(order)
    except Exception:
        pass  # the order stands even if the confirmation email fails to send

    return _to_order_out(order)


@router.get("/lookup", response_model=OrderOut)
def lookup_order(
    reference: str,
    name: str,
    db: Session = Depends(get_db),
) -> OrderOut:
    order = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.reference == reference)
        .first()
    )
    if order is None or not _name_matches(order, name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    return _to_order_out(order)


@router.post("/{reference}/proof", response_model=OrderOut)
def upload_proof_of_payment(
    reference: str,
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> OrderOut:
    order = _get_order_by_reference_or_404(db, reference)
    if not _name_matches(order, name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order is cancelled and can no longer take a proof of payment",
        )

    content_type = file.content_type or ""
    if not (content_type.startswith("image/") or content_type == "application/pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image or PDF"
        )

    order.proof_of_payment_url = get_storage().save(file, folder="proofs")
    db.commit()
    db.refresh(order)
    return _to_order_out(order)
