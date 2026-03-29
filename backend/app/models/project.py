import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ProjectStatus(str):
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="active")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="projects")
    test_plans = relationship("TestPlan", back_populates="project", cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="project", cascade="all, delete-orphan")