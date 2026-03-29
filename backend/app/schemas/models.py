from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime, date


# ── Projects ──────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str]
    status: str
    start_date: Optional[date]
    end_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Test Plans ────────────────────────────────────────────
class TestPlanCreate(BaseModel):
    project_id: str
    name: str
    description: Optional[str] = None
    status: str = "draft"


class TestPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class TestPlanResponse(BaseModel):
    id: str
    organization_id: str
    project_id: str
    name: str
    description: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Test Cases ────────────────────────────────────────────
class TestStep(BaseModel):
    step: int
    action: str
    expected: str


class TestCaseCreate(BaseModel):
    project_id: str
    test_plan_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    preconditions: Optional[str] = None
    test_steps: Optional[List[TestStep]] = []
    expected_result: Optional[str] = None
    priority: str = "medium"
    assigned_to: Optional[str] = None
    ai_generated: bool = False


class TestCaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    preconditions: Optional[str] = None
    test_steps: Optional[List[TestStep]] = None
    expected_result: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None


class TestCaseResponse(BaseModel):
    id: str
    organization_id: str
    project_id: str
    test_plan_id: Optional[str]
    title: str
    description: Optional[str]
    preconditions: Optional[str]
    test_steps: Optional[List[Any]]
    expected_result: Optional[str]
    status: str
    priority: str
    ai_generated: bool
    assigned_to: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── AI Generation Request ─────────────────────────────────
class AIGenerateTestCaseRequest(BaseModel):
    feature_description: str
    project_id: str
    test_plan_id: Optional[str] = None


# ── Execution Records ─────────────────────────────────────
class ExecutionCreate(BaseModel):
    test_case_id: str
    result_status: str   # passed | failed | blocked
    comments: Optional[str] = None


class ExecutionResponse(BaseModel):
    id: str
    organization_id: str
    test_case_id: str
    executed_by: str
    result_status: str
    comments: Optional[str]
    executed_at: datetime

    class Config:
        from_attributes = True


# ── Defects ───────────────────────────────────────────────
class DefectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str = "medium"
    priority: str = "medium"
    execution_record_id: Optional[str] = None
    test_case_id: Optional[str] = None
    assigned_to: Optional[str] = None


class DefectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None


class DefectResponse(BaseModel):
    id: str
    organization_id: str
    title: str
    description: Optional[str]
    severity: str
    priority: str
    status: str
    execution_record_id: Optional[str]
    test_case_id: Optional[str]
    assigned_to: Optional[str]
    ai_root_cause: Optional[str]
    ai_fix_suggestion: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True