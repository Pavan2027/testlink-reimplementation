"""
All AI feature implementations.
Each function is a thin wrapper over ai.complete_json() with a crafted prompt.
Users always trigger these explicitly — never called automatically.
"""
from typing import Optional, List
from app.ai.provider import ai


# ── Feature 1: Test Case Generation ──────────────────────────────────────────
async def generate_test_case(feature_description: str) -> dict:
    """
    Given a plain-English feature description, return a structured test case.
    User explicitly clicks 'Generate with AI' — this is never auto-triggered.
    """
    system = """You are a senior QA engineer. Given a feature description, generate a 
structured test case in JSON format. Be precise, practical, and thorough.

Return ONLY valid JSON in this exact structure:
{
  "title": "short descriptive title",
  "description": "what this test case validates",
  "preconditions": "what must be true before running this test",
  "test_steps": [
    {"step": 1, "action": "what the tester does", "expected": "what should happen"}
  ],
  "expected_result": "overall expected outcome",
  "priority": "low|medium|high|critical"
}"""

    user = f"Generate a test case for: {feature_description}"
    return await ai.complete_json(system, user)


# ── Feature 2: Defect Root Cause Analysis ────────────────────────────────────
async def analyze_defect(
    test_case_title: str,
    test_steps: list,
    execution_comments: str,
    failure_description: str,
) -> dict:
    """
    Analyze a failed test execution and suggest root cause + fix direction.
    Shown as a dismissible suggestion card on the defect form.
    """
    system = """You are a senior software engineer specializing in debugging and root cause analysis.
Given a failed test case, provide a concise analysis.

Return ONLY valid JSON:
{
  "root_cause": "2-3 sentence hypothesis about why this failed",
  "fix_suggestion": "specific, actionable fix recommendation",
  "fix_category": "UI bug|API error|Logic error|Data issue|Environment issue|Other",
  "confidence": "low|medium|high"
}"""

    steps_text = "\n".join(
        [f"Step {s.get('step')}: {s.get('action')} → Expected: {s.get('expected')}"
         for s in (test_steps or [])]
    )

    user = f"""Test Case: {test_case_title}
Steps:
{steps_text}
Execution Comments: {execution_comments or 'None provided'}
Failure Description: {failure_description}"""

    return await ai.complete_json(system, user)


# ── Feature 3: Report Insights ────────────────────────────────────────────────
async def generate_report_insights(report_data: dict) -> dict:
    """
    Given aggregated report metrics, return natural language insights.
    Shown in a collapsible 'AI Insights' section below report charts.
    """
    system = """You are a QA analyst providing test report insights. 
Be concise, specific, and actionable. Avoid generic statements.

Return ONLY valid JSON:
{
  "summary": "1-2 sentence overall health summary",
  "insights": [
    "specific observation 1",
    "specific observation 2",
    "specific observation 3"
  ],
  "risk_areas": ["area 1", "area 2"],
  "recommendations": ["action 1", "action 2"]
}"""

    user = f"Analyze this test report data and provide insights:\n{report_data}"
    return await ai.complete_json(system, user)


# ── Feature 4: Natural Language Query ────────────────────────────────────────
async def nl_to_query_response(
    question: str,
    org_id: str,
    context_summary: dict,
) -> dict:
    """
    Translates a natural language question into a structured query intent,
    then the router executes the appropriate service function.
    We do NOT generate raw SQL — we generate a structured intent that maps
    to safe, pre-defined service functions. This prevents SQL injection.
    """
    system = """You are a helpful assistant for a test management system.
Interpret the user's question and return a structured query intent.

Available query types:
- "failed_tests": get failed test cases (optional: project_name, limit)
- "open_defects": get open defects (optional: severity, project_name)
- "execution_summary": get pass/fail/blocked counts (optional: project_name)
- "recent_activity": get recent executions (optional: limit)
- "test_cases_by_status": get test cases by status (optional: status, project_name)
- "unknown": question cannot be answered with available data

Return ONLY valid JSON:
{
  "query_type": "one of the types above",
  "parameters": {"key": "value"},
  "natural_response_prefix": "In response to your question,"
}"""

    user = f"""User question: {question}
Available projects/context: {context_summary}"""

    return await ai.complete_json(system, user)