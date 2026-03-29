from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.main_routers import (
    projects_router,
    plans_router,
    cases_router,
    execution_router,
    defects_router,
    reports_router,
    chat_router,
)

# Create all tables (use Alembic in production for migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,   # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers under /api prefix
PREFIX = "/api"
app.include_router(auth_router, prefix=PREFIX)
app.include_router(users_router, prefix=PREFIX)
app.include_router(projects_router, prefix=PREFIX)
app.include_router(plans_router, prefix=PREFIX)
app.include_router(cases_router, prefix=PREFIX)
app.include_router(execution_router, prefix=PREFIX)
app.include_router(defects_router, prefix=PREFIX)
app.include_router(reports_router, prefix=PREFIX)
app.include_router(chat_router, prefix=PREFIX)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}