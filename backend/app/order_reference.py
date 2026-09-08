import secrets

from sqlalchemy.orm import Session

from app.models import Order

# Excludes 0/O and 1/I/L so a reference is unambiguous read back over the phone.
_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
_CODE_LENGTH = 6
_MAX_ATTEMPTS = 10


def _random_code() -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(_CODE_LENGTH))


def generate_order_reference(db: Session) -> str:
    for _ in range(_MAX_ATTEMPTS):
        reference = f"CM-{_random_code()}"
        exists = db.query(Order.id).filter(Order.reference == reference).first()
        if exists is None:
            return reference
    raise RuntimeError("Could not generate a unique order reference")
