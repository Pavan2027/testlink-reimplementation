from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from datetime import datetime
import re

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.auth import get_current_user
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import OrganizationRegister, LoginRequest, ChangePasswordRequest
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "access_token"
COOKIE_OPTIONS = {
    "httponly": True,
    "secure": False,   # set True in production (HTTPS)
    "samesite": "lax",
    "max_age": 60 * 60 * 8,   # 8 hours
}


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9-]", "-", text.lower().strip()).strip("-")


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_organization(
    body: OrganizationRegister,
    response: Response,
    db: Session = Depends(get_db),
):
    """Public endpoint — creates a new organization and its first admin user."""
    # Check org name uniqueness
    slug = slugify(body.org_slug or body.org_name)
    if db.query(Organization).filter(Organization.slug == slug).first():
        raise HTTPException(400, "Organization slug already taken. Try a different name.")

    # Create org
    org = Organization(name=body.org_name, slug=slug)
    db.add(org)
    db.flush()  # get org.id before creating user

    # Check email not already used in this org (shouldn't happen on first user but defensive)
    if db.query(User).filter(User.organization_id == org.id, User.email == body.admin_email).first():
        raise HTTPException(400, "Email already registered.")

    # Create admin user — no forced password change for the bootstrapped admin
    admin = User(
        organization_id=org.id,
        full_name=body.admin_full_name,
        email=body.admin_email,
        password_hash=hash_password(body.admin_password),
        role="admin",
        must_change_password=False,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    # Issue JWT immediately so they land on dashboard
    token = create_access_token({
        "sub": admin.id,
        "org_id": org.id,
        "role": admin.role,
        "must_change_password": admin.must_change_password,
    })
    response.set_cookie(COOKIE_NAME, token, **COOKIE_OPTIONS)

    return {"message": "Organization created successfully", "org_id": org.id}


@router.post("/login")
def login(
    body: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == body.email, User.is_active == True).first()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()

    token = create_access_token({
        "sub": user.id,
        "org_id": user.organization_id,
        "role": user.role,
        "must_change_password": user.must_change_password,
    })
    response.set_cookie(COOKIE_NAME, token, **COOKIE_OPTIONS)

    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "must_change_password": user.must_change_password,
            "organization_id": user.organization_id,
        },
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME)
    return {"message": "Logged out successfully"}


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(400, "Current password is incorrect.")

    current_user.password_hash = hash_password(body.new_password)
    current_user.must_change_password = False
    db.commit()

    # Re-issue token with updated must_change_password flag
    token = create_access_token({
        "sub": current_user.id,
        "org_id": current_user.organization_id,
        "role": current_user.role,
        "must_change_password": False,
    })
    response.set_cookie(COOKIE_NAME, token, **COOKIE_OPTIONS)
    return {"message": "Password changed successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user