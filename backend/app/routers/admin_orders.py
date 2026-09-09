from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session, selectinload

from app.auth import get_current_admin
from app.db import get_db
from app.models import Order, OrderLineItem, Variant
from app.order_lifecycle import InvalidTransitionError, transition
from app.storage import get_storage

router = APIRouter(prefix="/admin/orders", tags=["orders"], dependencies=[Depends(get_current_admin)])


class OrderLineItemOut(BaseModel):
    id: int
    product_id: int
    variant_id: int
    product_name: str
    variant_size: str | None
    variant_color: str | None
    unit_price: int
    quantity: int

    model_config = {"from_attributes": True}


class OrderSummaryOut(BaseModel):
    reference: str
    customer_name: str
    status: str
    proof_of_payment_url: str | None
    created_at: datetime
    total: int


class OrderDetailOut(BaseModel):
    reference: str
    customer_name: str
    customer_email: str | None
    customer_phone: str | None
    status: str
    proof_of_payment_url: str | None
    created_at: datetime
    items: list[OrderLineItemOut]
    total: int


class LineItemUpdate(BaseModel):
    variant_id: int | None = None
    quantity: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def _at_least_one_field(self) -> "LineItemUpdate":
        if self.variant_id is None and self.quantity is None:
            raise ValueError("Provide a variant_id and/or quantity to update")
        return self


def _order_total(order: Order) -> int:
    return sum(item.unit_price * item.quantity for item in order.items)


def _to_summary(order: Order) -> OrderSummaryOut:
    return OrderSummaryOut(
        reference=order.reference,
        customer_name=order.customer_name,
        status=order.status,
        proof_of_payment_url=order.proof_of_payment_url,
        created_at=order.created_at,
        total=_order_total(order),
    )


def _to_detail(order: Order) -> OrderDetailOut:
    return OrderDetailOut(
        reference=order.reference,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        status=order.status,
        proof_of_payment_url=order.proof_of_payment_url,
        created_at=order.created_at,
        items=[OrderLineItemOut.model_validate(item) for item in order.items],
        total=_order_total(order),
    )


def _get_order_or_404(db: Session, reference: str) -> Order:
    order = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.reference == reference)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def _get_line_item_or_404(order: Order, item_id: int) -> OrderLineItem:
    for item in order.items:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Line item not found")


# Same set of "still in play" statuses that cancellation allows — once an order
# is collected or cancelled there's nothing left to correct.
_EDITABLE_STATUSES = {"pending_payment", "paid", "ready_for_collection"}


def _require_editable(order: Order) -> None:
    if order.status not in _EDITABLE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit items on an order that is {order.status}",
        )


def _apply_transition(db: Session, order: Order, target_status: str) -> OrderDetailOut:
    try:
        order.status = transition(order.status, target_status)
    except InvalidTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    db.commit()
    db.refresh(order)
    return _to_detail(order)


@router.get("", response_model=list[OrderSummaryOut])
def list_orders(
    status_filter: str | None = None,
    sort: Literal["oldest", "newest"] = "oldest",
    db: Session = Depends(get_db),
) -> list[OrderSummaryOut]:
    query = db.query(Order).options(selectinload(Order.items))
    if status_filter:
        query = query.filter(Order.status == status_filter)
    query = query.order_by(Order.created_at.asc() if sort == "oldest" else Order.created_at.desc())
    return [_to_summary(order) for order in query.all()]


@router.get("/{reference}", response_model=OrderDetailOut)
def get_order(reference: str, db: Session = Depends(get_db)) -> OrderDetailOut:
    return _to_detail(_get_order_or_404(db, reference))


@router.post("/{reference}/mark-paid", response_model=OrderDetailOut)
def mark_paid(reference: str, db: Session = Depends(get_db)) -> OrderDetailOut:
    order = _get_order_or_404(db, reference)
    if not order.proof_of_payment_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attach proof of payment before marking this order as paid",
        )
    return _apply_transition(db, order, "paid")


@router.post("/{reference}/mark-ready-for-collection", response_model=OrderDetailOut)
def mark_ready_for_collection(reference: str, db: Session = Depends(get_db)) -> OrderDetailOut:
    order = _get_order_or_404(db, reference)
    return _apply_transition(db, order, "ready_for_collection")


@router.post("/{reference}/mark-collected", response_model=OrderDetailOut)
def mark_collected(reference: str, db: Session = Depends(get_db)) -> OrderDetailOut:
    order = _get_order_or_404(db, reference)
    return _apply_transition(db, order, "collected")


@router.post("/{reference}/cancel", response_model=OrderDetailOut)
def cancel_order(reference: str, db: Session = Depends(get_db)) -> OrderDetailOut:
    order = _get_order_or_404(db, reference)
    return _apply_transition(db, order, "cancelled")


@router.post("/{reference}/proof", response_model=OrderDetailOut)
def upload_proof_of_payment(
    reference: str, file: UploadFile = File(...), db: Session = Depends(get_db)
) -> OrderDetailOut:
    order = _get_order_or_404(db, reference)

    content_type = file.content_type or ""
    if not (content_type.startswith("image/") or content_type == "application/pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image or PDF"
        )

    order.proof_of_payment_url = get_storage().save(file, folder="proofs")
    db.commit()
    db.refresh(order)
    return _to_detail(order)


@router.patch("/{reference}/items/{item_id}", response_model=OrderDetailOut)
def update_line_item(
    reference: str, item_id: int, body: LineItemUpdate, db: Session = Depends(get_db)
) -> OrderDetailOut:
    order = _get_order_or_404(db, reference)
    _require_editable(order)
    item = _get_line_item_or_404(order, item_id)

    if body.variant_id is not None:
        variant = (
            db.query(Variant)
            .options(selectinload(Variant.product))
            .filter(Variant.id == body.variant_id)
            .first()
        )
        if variant is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Variant not found")
        item.product_id = variant.product_id
        item.variant_id = variant.id
        item.product_name = variant.product.name
        item.variant_size = variant.size
        item.variant_color = variant.color
        item.unit_price = variant.price

    if body.quantity is not None:
        item.quantity = body.quantity

    db.commit()
    db.refresh(order)
    return _to_detail(order)


@router.delete("/{reference}/items/{item_id}", response_model=OrderDetailOut)
def delete_line_item(reference: str, item_id: int, db: Session = Depends(get_db)) -> OrderDetailOut:
    order = _get_order_or_404(db, reference)
    _require_editable(order)
    item = _get_line_item_or_404(order, item_id)

    order.items.remove(item)
    db.delete(item)
    db.commit()
    db.refresh(order)
    return _to_detail(order)
