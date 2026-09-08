from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_admin, verify_password
from app.db import get_db
from app.models import AdminUser

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminMeResponse(BaseModel):
    email: str


@router.post("/login", response_model=AdminLoginResponse)
def login(body: AdminLoginRequest, db: Session = Depends(get_db)) -> AdminLoginResponse:
    admin = db.query(AdminUser).filter(AdminUser.email == body.email).first()
    if admin is None or not verify_password(body.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return AdminLoginResponse(access_token=create_access_token(admin.id))


@router.get("/me", response_model=AdminMeResponse)
def me(admin: AdminUser = Depends(get_current_admin)) -> AdminMeResponse:
    return AdminMeResponse(email=admin.email)
