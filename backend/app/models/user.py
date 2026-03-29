import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    TESTER = "tester"
    DEVELOPER = "developer"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)

    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.TESTER)

    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=True)  # force change on first login

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="users")
    execution_records = relationship("ExecutionRecord", back_populates="executed_by_user")

    # Unique email per organization (not globally unique)
    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("organization_id", "email", name="uq_user_org_email"),
    )