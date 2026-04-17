from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user, require_role
from app.models.user import User
from app.models.project import Project
from app.models.testing import TestPlan, TestCase, ExecutionRecord, Defect
from app.schemas.models import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    TestPlanCreate, TestPlanUpdate, TestPlanResponse,
    TestCaseCreate, TestCaseUpdate, TestCaseResponse,
    AIGenerateTestCaseRequest,
    ExecutionCreate, ExecutionResponse,
    DefectCreate, DefectUpdate, DefectResponse,
)
from app.ai.features import (
    generate_test_case,
    analyze_defect,
    generate_report_insights,
    nl_to_query_response,
)
from datetime import datetime

# ── Projects ──────────────────────────────────────────────────────────────────
projects_router = APIRouter(prefix="/projects", tags=["projects"])


@projects_router.get("/", response_model=List[ProjectResponse])
def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Project).filter(Project.organization_id == current_user.organization_id).all()


@projects_router.post("/", response_model=ProjectResponse, status_code=201)
def create_project(
    body: ProjectCreate,
    current_user: User = Depends(require_role("admin", "manager")),
    db: Session = Depends(get_db),
):
    if body.start_date and body.end_date and body.end_date < body.start_date:
        raise HTTPException(400, "End date cannot be before start date.")
    project = Project(**body.model_dump(), organization_id=current_user.organization_id, created_by=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@projects_router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str, body: ProjectUpdate,
    current_user: User = Depends(require_role("admin", "manager")), db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == current_user.organization_id).first()
    if not project:
        raise HTTPException(404, "Project not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(project, k, v)
    db.commit()
    db.refresh(project)
    return project


@projects_router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: str,
    current_user: User = Depends(require_role("admin")), db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == current_user.organization_id).first()
    if not project:
        raise HTTPException(404, "Project not found.")
    db.delete(project)
    db.commit()


# ── Test Plans ────────────────────────────────────────────────────────────────
plans_router = APIRouter(prefix="/test-plans", tags=["test-plans"])


@plans_router.get("/", response_model=List[TestPlanResponse])
def list_plans(
    project_id: str = None,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    q = db.query(TestPlan).filter(TestPlan.organization_id == current_user.organization_id)
    if project_id:
        q = q.filter(TestPlan.project_id == project_id)
    return q.all()


@plans_router.post("/", response_model=TestPlanResponse, status_code=201)
def create_plan(
    body: TestPlanCreate,
    current_user: User = Depends(require_role("admin", "manager")), db: Session = Depends(get_db),
):
    plan = TestPlan(**body.model_dump(), organization_id=current_user.organization_id, created_by=current_user.id)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@plans_router.patch("/{plan_id}", response_model=TestPlanResponse)
def update_plan(
    plan_id: str, body: TestPlanUpdate,
    current_user: User = Depends(require_role("admin", "manager")), db: Session = Depends(get_db),
):
    plan = db.query(TestPlan).filter(TestPlan.id == plan_id, TestPlan.organization_id == current_user.organization_id).first()
    if not plan:
        raise HTTPException(404, "Test plan not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(plan, k, v)
    db.commit()
    db.refresh(plan)
    return plan


# ── Test Cases ────────────────────────────────────────────────────────────────
cases_router = APIRouter(prefix="/test-cases", tags=["test-cases"])


@cases_router.get("/", response_model=List[TestCaseResponse])
def list_cases(
    project_id: str = None, test_plan_id: str = None, assigned_to: str = None,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    q = db.query(TestCase).filter(TestCase.organization_id == current_user.organization_id)
    if project_id:
        q = q.filter(TestCase.project_id == project_id)
    if test_plan_id:
        q = q.filter(TestCase.test_plan_id == test_plan_id)
    if assigned_to:
        q = q.filter(TestCase.assigned_to == assigned_to)
    return q.all()


@cases_router.post("/", response_model=TestCaseResponse, status_code=201)
def create_case(
    body: TestCaseCreate,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    steps = [s.model_dump() for s in body.test_steps] if body.test_steps else []
    case = TestCase(
        **{k: v for k, v in body.model_dump().items() if k != "test_steps"},
        test_steps=steps,
        organization_id=current_user.organization_id,
        created_by=current_user.id,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@cases_router.patch("/{case_id}", response_model=TestCaseResponse)
def update_case(
    case_id: str, body: TestCaseUpdate,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    case = db.query(TestCase).filter(TestCase.id == case_id, TestCase.organization_id == current_user.organization_id).first()
    if not case:
        raise HTTPException(404, "Test case not found.")
    data = body.model_dump(exclude_none=True)
    if "test_steps" in data and data["test_steps"]:
        data["test_steps"] = [s if isinstance(s, dict) else s.model_dump() for s in data["test_steps"]]
    for k, v in data.items():
        setattr(case, k, v)
    db.commit()
    db.refresh(case)
    return case


@cases_router.delete("/{case_id}", status_code=204)
def delete_case(
    case_id: str,
    current_user: User = Depends(require_role("admin", "manager")), db: Session = Depends(get_db),
):
    case = db.query(TestCase).filter(TestCase.id == case_id, TestCase.organization_id == current_user.organization_id).first()
    if not case:
        raise HTTPException(404, "Test case not found.")
    db.delete(case)
    db.commit()


@cases_router.post("/ai-generate")
async def ai_generate_test_case(
    body: AIGenerateTestCaseRequest,
    current_user: User = Depends(get_current_user),
):
    """AI Feature 1 — generate structured test case from plain-English description."""
    result = await generate_test_case(body.feature_description)
    return result


# ── Execution ─────────────────────────────────────────────────────────────────
execution_router = APIRouter(prefix="/executions", tags=["execution"])


@execution_router.get("/", response_model=List[ExecutionResponse])
def list_executions(
    test_case_id: str = None,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    q = db.query(ExecutionRecord).filter(ExecutionRecord.organization_id == current_user.organization_id)
    if test_case_id:
        q = q.filter(ExecutionRecord.test_case_id == test_case_id)
    return q.order_by(ExecutionRecord.executed_at.desc()).all()


@execution_router.post("/", response_model=ExecutionResponse, status_code=201)
def record_execution(
    body: ExecutionCreate,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    record = ExecutionRecord(
        **body.model_dump(),
        organization_id=current_user.organization_id,
        executed_by=current_user.id,
    )
    db.add(record)
    # Update test case status to match execution result
    case = db.query(TestCase).filter(TestCase.id == body.test_case_id).first()
    if case:
        case.status = body.result_status
    db.commit()
    db.refresh(record)
    return record


# ── Defects ───────────────────────────────────────────────────────────────────
defects_router = APIRouter(prefix="/defects", tags=["defects"])


@defects_router.get("/", response_model=List[DefectResponse])
def list_defects(
    status: str = None, severity: str = None,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    q = db.query(Defect).filter(Defect.organization_id == current_user.organization_id)
    if status:
        q = q.filter(Defect.status == status)
    if severity:
        q = q.filter(Defect.severity == severity)
    return q.order_by(Defect.created_at.desc()).all()


@defects_router.post("/", response_model=DefectResponse, status_code=201)
def create_defect(
    body: DefectCreate,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    defect = Defect(
        **body.model_dump(),
        organization_id=current_user.organization_id,
        reported_by=current_user.id,
    )
    db.add(defect)
    db.commit()
    db.refresh(defect)
    return defect


@defects_router.patch("/{defect_id}", response_model=DefectResponse)
def update_defect(
    defect_id: str, body: DefectUpdate,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    defect = db.query(Defect).filter(Defect.id == defect_id, Defect.organization_id == current_user.organization_id).first()
    if not defect:
        raise HTTPException(404, "Defect not found.")
    data = body.model_dump(exclude_none=True)
    if data.get("status") == "resolved":
        data["resolved_at"] = datetime.utcnow()
    for k, v in data.items():
        setattr(defect, k, v)
    db.commit()
    db.refresh(defect)
    return defect


@defects_router.post("/{defect_id}/ai-analyze")
async def ai_analyze_defect(
    defect_id: str,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """AI Feature 2 — analyze defect root cause. User clicks 'Analyze with AI'."""
    defect = db.query(Defect).filter(Defect.id == defect_id, Defect.organization_id == current_user.organization_id).first()
    if not defect:
        raise HTTPException(404, "Defect not found.")

    test_case = db.query(TestCase).filter(TestCase.id == defect.test_case_id).first() if defect.test_case_id else None
    execution = db.query(ExecutionRecord).filter(ExecutionRecord.id == defect.execution_record_id).first() if defect.execution_record_id else None

    result = await analyze_defect(
        test_case_title=test_case.title if test_case else "Unknown",
        test_steps=test_case.test_steps if test_case else [],
        execution_comments=execution.comments if execution else "",
        failure_description=defect.description or defect.title,
    )

    # Persist AI analysis to the defect record
    defect.ai_root_cause = result.get("root_cause")
    defect.ai_fix_suggestion = result.get("fix_suggestion")
    db.commit()

    return result


# ── Reports ───────────────────────────────────────────────────────────────────
reports_router = APIRouter(prefix="/reports", tags=["reports"])


@reports_router.get("/summary")
def get_report_summary(
    project_id: str = None,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Aggregate execution stats for report charts."""
    org_id = current_user.organization_id

    case_q = db.query(TestCase).filter(TestCase.organization_id == org_id)
    exec_q = db.query(ExecutionRecord).filter(ExecutionRecord.organization_id == org_id)
    defect_q = db.query(Defect).filter(Defect.organization_id == org_id)

    if project_id:
        case_q = case_q.filter(TestCase.project_id == project_id)

    cases = case_q.all()
    executions = exec_q.all()
    defects = defect_q.all()

    return {
        "total_test_cases": len(cases),
        "by_status": {
            "passed": sum(1 for c in cases if c.status == "passed"),
            "failed": sum(1 for c in cases if c.status == "failed"),
            "blocked": sum(1 for c in cases if c.status == "blocked"),
            "not_run": sum(1 for c in cases if c.status == "not_run"),
        },
        "total_executions": len(executions),
        "total_defects": len(defects),
        "defects_by_severity": {
            "critical": sum(1 for d in defects if d.severity == "critical"),
            "high": sum(1 for d in defects if d.severity == "high"),
            "medium": sum(1 for d in defects if d.severity == "medium"),
            "low": sum(1 for d in defects if d.severity == "low"),
        },
        "defects_by_status": {
            "open": sum(1 for d in defects if d.status == "open"),
            "in_progress": sum(1 for d in defects if d.status == "in_progress"),
            "resolved": sum(1 for d in defects if d.status == "resolved"),
            "closed": sum(1 for d in defects if d.status == "closed"),
        },
    }


@reports_router.post("/ai-insights")
async def ai_report_insights(
    project_id: str = None,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """AI Feature 3 — generate insights from real report data including actual defect content."""
    org_id = current_user.organization_id

    # Aggregate summary
    summary = get_report_summary(project_id=project_id, current_user=current_user, db=db)

    # Actual defects with titles and descriptions
    defect_q = db.query(Defect).filter(Defect.organization_id == org_id)
    if project_id:
        defect_q = defect_q.filter(Defect.test_case_id.in_(
            db.query(TestCase.id).filter(TestCase.project_id == project_id)
        ))
    defects = defect_q.order_by(Defect.created_at.desc()).limit(20).all()

    # Actual test cases
    case_q = db.query(TestCase).filter(TestCase.organization_id == org_id)
    if project_id:
        case_q = case_q.filter(TestCase.project_id == project_id)
    cases = case_q.limit(30).all()

    # Recent executions with comments
    exec_q = db.query(ExecutionRecord).filter(ExecutionRecord.organization_id == org_id)
    recent_executions = exec_q.order_by(ExecutionRecord.executed_at.desc()).limit(10).all()

    # Rich context with actual content
    rich_context = {
        "summary_stats": summary,
        "defects": [
            {
                "title": d.title,
                "description": d.description or "No description provided",
                "severity": d.severity,
                "priority": d.priority,
                "status": d.status,
            }
            for d in defects
        ],
        "test_cases": [
            {
                "title": tc.title,
                "status": tc.status,
                "priority": tc.priority,
            }
            for tc in cases
        ],
        "recent_executions": [
            {
                "result": ex.result_status,
                "comments": ex.comments or "",
            }
            for ex in recent_executions
        ],
    }

    result = await generate_report_insights(rich_context)
    return result


# ── NL Chat ───────────────────────────────────────────────────────────────────
chat_router = APIRouter(prefix="/chat", tags=["chat"])


@chat_router.post("/query")
async def nl_chat_query(
    question: str,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """AI Feature 4 — natural language query interface."""
    projects = db.query(Project).filter(Project.organization_id == current_user.organization_id).all()
    context = {"projects": [p.name for p in projects]}

    intent = await nl_to_query_response(question, current_user.organization_id, context)
    query_type = intent.get("query_type", "unknown")
    params = intent.get("parameters", {})
    prefix = intent.get("natural_response_prefix", "Here's what I found:")

    # Map intent to safe service calls — no raw SQL ever executed from AI output
    result_data = []
    if query_type == "failed_tests":
        cases = db.query(TestCase).filter(
            TestCase.organization_id == current_user.organization_id,
            TestCase.status == "failed"
        ).limit(params.get("limit", 10)).all()
        result_data = [{"id": c.id, "title": c.title, "status": c.status} for c in cases]

    elif query_type == "open_defects":
        q = db.query(Defect).filter(Defect.organization_id == current_user.organization_id, Defect.status == "open")
        if params.get("severity"):
            q = q.filter(Defect.severity == params["severity"])
        result_data = [{"id": d.id, "title": d.title, "severity": d.severity} for d in q.limit(10).all()]

    elif query_type == "execution_summary":
        summary = get_report_summary(current_user=current_user, db=db)
        result_data = [summary]

    elif query_type == "recent_activity":
        execs = db.query(ExecutionRecord).filter(
            ExecutionRecord.organization_id == current_user.organization_id
        ).order_by(ExecutionRecord.executed_at.desc()).limit(params.get("limit", 5)).all()
        result_data = [{"test_case_id": e.test_case_id, "result": e.result_status, "at": str(e.executed_at)} for e in execs]

    return {
        "question": question,
        "answer_prefix": prefix,
        "query_type": query_type,
        "data": result_data,
        "count": len(result_data),
    }