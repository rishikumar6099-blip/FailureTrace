import re
from typing import Any


def run_stack_trace_agent(stack_trace: str) -> dict[str, Any]:
    """Analyze stack-trace evidence locally."""

    lines = [line.strip() for line in stack_trace.splitlines() if line.strip()]

    locations = []
    exceptions = []

    for line in lines:
        if "File " in line and ", line " in line:
            locations.append(line)

        if "Error:" in line or "Exception:" in line:
            exceptions.append(line)

    return {
        "agent": "Stack Trace Agent",
        "observations": {
            "locations": locations[-5:],
            "exceptions": exceptions[-5:],
            "trace_present": bool(lines),
        },
    }


def run_log_analysis_agent(logs: str) -> dict[str, Any]:
    """Analyze application logs locally."""

    lines = [line.strip() for line in logs.splitlines() if line.strip()]

    errors = [
        line for line in lines
        if "ERROR" in line.upper() or "EXCEPTION" in line.upper()
    ]

    warnings = [
        line for line in lines
        if "WARN" in line.upper()
    ]

    return {
        "agent": "Log Analysis Agent",
        "observations": {
            "errors": errors[-10:],
            "warnings": warnings[-10:],
            "log_lines": len(lines),
        },
    }


def run_change_analysis_agent(recent_changes: str) -> dict[str, Any]:
    """Analyze recent-change evidence locally."""

    text = recent_changes.strip()

    change_signals = []

    patterns = [
        r"changed",
        r"updated",
        r"upgraded",
        r"downgraded",
        r"deployed",
        r"configured",
        r"rotated",
        r"modified",
    ]

    for pattern in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            change_signals.append(pattern)

    return {
        "agent": "Change Analysis Agent",
        "observations": {
            "recent_change_present": bool(text),
            "change_signals": change_signals,
            "description": text,
        },
    }


def run_specialist_agents(
    stack_trace: str,
    logs: str,
    recent_changes: str,
) -> dict[str, dict[str, Any]]:
    """
    Orchestrate the specialist agents locally.

    These agents extract evidence without making additional LLM calls.
    """

    return {
        "stack_trace": run_stack_trace_agent(stack_trace),
        "logs": run_log_analysis_agent(logs),
        "recent_changes": run_change_analysis_agent(recent_changes),
    }
from google import genai


def _extract_text(response) -> str:
    """Safely extract text from a Gemini response."""
    text = getattr(response, "text", None)
    if text:
        return text.strip()

    output_text = getattr(response, "output_text", None)
    if output_text:
        return output_text.strip()

    return str(response).strip()


async def run_root_cause_synthesizer(
    client: genai.Client,
    original_evidence: str,
    specialist_findings: dict,
):
    """Use one Gemini call to synthesize the specialist findings."""

    from backend.models import InvestigationResult

    prompt = f"""
You are the Root Cause Synthesizer for FailureTrace.

Multiple specialist agents have already analyzed the failure locally.

Your job is to combine their findings with the original evidence and produce
the final investigation result.

ORIGINAL EVIDENCE:
{original_evidence}

SPECIALIST FINDINGS:
{specialist_findings}

Rules:
- Use only the supplied evidence.
- Do not invent facts.
- Identify the most likely root cause.
- Support the root cause with specific evidence.
- If evidence is insufficient, explicitly say so and use a low confidence.
- Confidence must be between 0.0 and 1.0.
- Build a logical failure chain.
- Recommend practical fixes.
- Provide a verification plan.
- Set status to "needs_verification".

Return ONLY the structured investigation result.
"""

    response = await client.aio.interactions.create(
        model="gemini-3.6-flash",
        input=prompt,
        system_instruction=(
            "You are the senior root-cause synthesis agent for FailureTrace."
        ),
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": InvestigationResult.model_json_schema(),
        },
        store=False,
    )

    result_text = _extract_text(response)

    return InvestigationResult.model_validate_json(result_text)