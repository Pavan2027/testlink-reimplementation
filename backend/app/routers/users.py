from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user, require_role
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Admin only — list all users in the organization."""
    return db.query(User).filter(User.organization_id == current_user.organization_id).all()


@router.post("/", response_model=UserResponse, status_code=201)
def create_user(
    body: UserCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Admin only — create a new user in the organization."""
    if db.query(User).filter(
        User.organization_id == current_user.organization_id,
        User.email == body.email,
    ).first():
        raise HTTPException(400, "Email already exists in this organization.")

    user = User(
        organization_id=current_user.organization_id,
        full_name=body.full_name,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        must_change_password=True,  # Admin-created users must change password on first login
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    body: UserUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user.organization_id,
    ).first()
    if not user:
        raise HTTPException(404, "User not found.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def deactivate_user(
    user_id: str,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot deactivate your own account.")

    user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user.organization_id,
    ).first()
    if not user:
        raise HTTPException(404, "User not found.")

    user.is_active = False
    db.commit()