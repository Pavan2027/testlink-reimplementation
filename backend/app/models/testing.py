import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class TestPlan(Base):
    __tablename__ = "test_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="draft")  # draft | active | closed

    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="test_plans")
    test_cases = relationship("TestCase", back_populates="test_plan")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    test_plan_id = Column(String, ForeignKey("test_plans.id"), nullable=True)

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    preconditions = Column(Text, nullable=True)
    # Stored as JSON array: [{"step": 1, "action": "...", "expected": "..."}]
    test_steps = Column(JSON, nullable=True, default=list)
    expected_result = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="not_run")  # not_run | passed | failed | blocked
    priority = Column(String(20), nullable=False, default="medium")  # low | medium | high | critical

    # AI generation flag — was this test case AI-generated?
    ai_generated = Column(Boolean, default=False)

    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="test_cases")
    test_plan = relationship("TestPlan", back_populates="test_cases")
    execution_records = relationship("ExecutionRecord", back_populates="test_case", cascade="all, delete-orphan")


class ExecutionRecord(Base):
    __tablename__ = "execution_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    test_case_id = Column(String, ForeignKey("test_cases.id"), nullable=False)
    executed_by = Column(String, ForeignKey("users.id"), nullable=False)

    result_status = Column(String(20), nullable=False)  # passed | failed | blocked
    comments = Column(Text, nullable=True)
    executed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    test_case = relationship("TestCase", back_populates="execution_records")
    executed_by_user = relationship("User", back_populates="execution_records")
    defects = relationship("Defect", back_populates="execution_record", cascade="all, delete-orphan")


class Defect(Base):
    __tablename__ = "defects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    execution_record_id = Column(String, ForeignKey("execution_records.id"), nullable=True)
    test_case_id = Column(String, ForeignKey("test_cases.id"), nullable=True)

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False, default="medium")   # low | medium | high | critical
    priority = Column(String(20), nullable=False, default="medium")   # low | medium | high | critical
    status = Column(String(50), nullable=False, default="open")       # open | in_progress | resolved | closed

    # AI analysis suggestion stored here
    ai_root_cause = Column(Text, nullable=True)
    ai_fix_suggestion = Column(Text, nullable=True)

    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    reported_by = Column(String, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    execution_record = relationship("ExecutionRecord", back_populates="defects")