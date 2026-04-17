# TestLink Reimplementation

> A modern, AI-powered test management platform built as a reimplementation of the open-source TestLink tool. Developed for BCSE301P — Software Engineering, VIT Vellore.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite)

---

## Overview

TestLink Reimplementation is a full-stack web application that covers the complete software testing lifecycle — from project setup and test case creation through execution, defect tracking, and reporting. It is built for software teams with role-based access control and four integrated AI features powered by a swappable LLM provider.

The project was reverse-engineered from the original TestLink open-source tool and rebuilt using modern technologies following standard software engineering practices (IEEE 830 SRS, layered architecture, centralized control model).

---

## Features

### Core Modules
| Module | Description |
|---|---|
| **Project Management** | Create, archive, and manage test projects with timelines and status tracking |
| **Test Plan Management** | Organize test cases into structured plans per project |
| **Test Case Management** | Create structured test cases with steps, preconditions, and expected results |
| **Test Execution Console** | Split-panel interface to execute test cases and record pass/fail/blocked results |
| **Defect Tracking** | Full defect lifecycle — Open → In Progress → Resolved → Closed |
| **Reports & Metrics** | Visual dashboards with pie charts, bar charts, pass rate, and defect breakdowns |
| **User Management** | Admin-controlled user creation with role assignment and temporary passwords |

### AI Features (all optional, never forced)
| Feature | Description |
|---|---|
| **AI Test Case Generation** | Describe a feature in plain English — get a fully structured test case with steps |
| **AI Defect Root Cause Analysis** | Analyzes failed test data and suggests root cause and fix direction |
| **AI Report Insights** | Generates natural language insights referencing actual defect and test case names |
| **Natural Language Chat** | Ask questions about your test data in plain English from any dashboard page |

### Architecture Highlights
- **Multi-tenant** — Each company registers as an isolated organization; data is fully scoped
- **Role-based access control** — Admin, Manager, Tester, Developer each see only what they need
- **JWT authentication** — FastAPI owns auth; tokens stored in httpOnly cookies
- **Swappable AI provider** — Change model/provider with three lines in `.env`, no code changes
- **Offline capable** — Runs fully on localhost with SQLite and Ollama; no internet required

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| UI Components | shadcn/ui, Radix UI, Recharts, Lucide Icons |
| Data Fetching | TanStack Query (React Query) |
| Backend | FastAPI, Python 3.10+ |
| ORM | SQLAlchemy 2.0, Alembic |
| Database | SQLite (local/demo) or PostgreSQL via Supabase |
| Auth | FastAPI JWT (httpOnly cookies), bcrypt password hashing |
| AI | OpenAI-compatible API — Gemini, Groq, Ollama, or any compatible provider |

---

## Project Structure

```
testlink-reimplementation/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── provider.py        # Swappable AI provider abstraction
│   │   │   └── features.py        # 4 AI feature implementations
│   │   ├── core/
│   │   │   ├── auth.py            # JWT dependency injection + role guards
│   │   │   ├── config.py          # Pydantic settings from .env
│   │   │   ├── database.py        # SQLAlchemy engine + session
│   │   │   └── security.py        # bcrypt + JWT sign/verify
│   │   ├── models/
│   │   │   ├── organization.py
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   └── testing.py         # TestPlan, TestCase, ExecutionRecord, Defect
│   │   ├── routers/
│   │   │   ├── auth.py            # /auth/register, /login, /logout, /me
│   │   │   ├── users.py           # /users CRUD (admin only)
│   │   │   └── main_routers.py    # All other module routers
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   └── models.py
│   │   └── main.py                # FastAPI app entry point
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/
    │   │   │   ├── login/
    │   │   │   └── register/
    │   │   ├── dashboard/
    │   │   │   ├── projects/
    │   │   │   ├── test-plans/
    │   │   │   ├── test-cases/
    │   │   │   ├── execution/
    │   │   │   ├── defects/
    │   │   │   ├── reports/
    │   │   │   └── users/
    │   │   ├── change-password/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx            # Landing page
    │   │   └── providers.tsx
    │   ├── components/
    │   │   ├── ui/                 # Modal, Badge, EmptyState, FormFields, PageHeader
    │   │   ├── modules/            # Feature-specific components
    │   │   └── ai/                 # ChatPanel
    │   └── lib/
    │       ├── api.ts              # Axios client + typed API helpers
    │       └── auth.tsx            # AuthContext, useAuth, role helpers
    ├── package.json
    ├── tailwind.config.ts
    └── tsconfig.json
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/testlink-reimplementation.git
cd testlink-reimplementation
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate.bat

# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — see Configuration section below
```

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Start the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

The app will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/api/docs

---

## Configuration

Copy `backend/.env.example` to `backend/.env` and fill in the values:

```env
# Database
# Option A — SQLite (no setup required, recommended for local/demo)
DATABASE_URL="sqlite:///./testlink.db"

# Option B — PostgreSQL via Supabase
# DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

# Auth — generate with: openssl rand -hex 32
SECRET_KEY="your-secret-key-here"
ACCESS_TOKEN_EXPIRE_MINUTES=480

# AI Provider — swap these three lines to change models
AI_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai"
AI_MODEL="gemini-2.0-flash"
AI_API_KEY="your-api-key-here"

# App
FRONTEND_URL="http://localhost:3000"
```

### SQLite setup (one-line change)

For local or offline use, set:
```env
DATABASE_URL="sqlite:///./testlink.db"
```

Then add to `backend/app/core/database.py`:
```python
from sqlalchemy.pool import StaticPool

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
```

Tables are **auto-created** on first startup — no migrations needed.

---

## Swapping AI Models

Change three lines in `.env` — no code changes required:

```env
# Google Gemini (free tier — recommended)
AI_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai"
AI_MODEL="gemini-2.0-flash"
AI_API_KEY="your-gemini-key"

# Groq (free tier — fastest, best for demos)
AI_BASE_URL="https://api.groq.com/openai/v1"
AI_MODEL="llama-3.1-8b-instant"
AI_API_KEY="your-groq-key"

# Ollama (fully offline — no internet, no API key)
AI_BASE_URL="http://localhost:11434/v1"
AI_MODEL="qwen2.5:7b"
AI_API_KEY="ollama"
```

**Get free API keys:**
- Gemini: https://aistudio.google.com/apikey
- Groq: https://console.groq.com

**Ollama (offline setup):**
```bash
# Install from https://ollama.com then pull a model
ollama pull qwen2.5:7b
```

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full access — user management, all modules, organization settings |
| **Manager** | Projects, test plans, test cases, execution, defects, reports |
| **Tester** | Test cases (create + execute), defects, AI test case generation |
| **Developer** | View test cases and test plans, update defect status, AI defect analysis |

### First-time setup

1. Visit `http://localhost:3000/register` to create your organization
2. The registering user becomes the **System Admin**
3. Admin logs in and goes to **User Management** to create team members
4. New users receive temporary passwords and are forced to change them on first login

---

## Running Offline (Lab / Demo)

The entire application can run without internet:

| Service | Offline Solution |
|---|---|
| Database | SQLite — single `.db` file, zero setup |
| AI | Ollama — local model inference, no API calls |
| Frontend | `npm run dev` — no external CDN dependencies |
| Backend | `uvicorn` — fully local |

```bash
# Install Ollama and pull model at home (requires internet once)
ollama pull qwen2.5:7b

# Then at the lab — everything runs offline
uvicorn app.main:app --reload --port 8000   # terminal 1
npm run dev                                  # terminal 2
```

---

## API Reference

The full interactive API documentation is available at `http://localhost:8000/api/docs` when the backend is running.

### Key endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create organization + admin | Public |
| POST | `/api/auth/login` | Login and receive JWT cookie | Public |
| POST | `/api/auth/logout` | Clear session | Any |
| GET | `/api/auth/me` | Get current user | Any |
| GET | `/api/projects/` | List projects | Any |
| POST | `/api/projects/` | Create project | Admin, Manager |
| POST | `/api/test-cases/ai-generate` | AI test case generation | Any |
| POST | `/api/executions/` | Record test execution | Any |
| POST | `/api/defects/{id}/ai-analyze` | AI defect analysis | Any |
| GET | `/api/reports/summary` | Aggregated metrics | Any |
| POST | `/api/reports/ai-insights` | AI report insights | Any |
| POST | `/api/chat/query` | Natural language query | Any |

---

## License

This project was developed for academic purposes as part of the BCSE301P Software Engineering course at VIT Vellore. The original TestLink tool is licensed under GPL-2.0.

---

<p align="center">Built with Next.js + FastAPI · VIT Vellore · 2026</p>