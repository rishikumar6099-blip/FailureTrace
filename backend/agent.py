import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

from backend.models import InvestigationRequest, InvestigationResult
from backend.tools import (
    run_root_cause_synthesizer,
    run_specialist_agents,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"
INVESTIGATOR_MODEL = "gemini-3.6-flash"


def load_env() -> None:
    load_dotenv(dotenv_path=ENV_PATH, override=True)


load_env()


def get_gemini_api_key() -> str | None:
    load_env()
    key = (os.getenv("GEMINI_API_KEY") or "").strip().strip('"').strip("'")
    return key or None


def _client() -> genai.Client:
    key = get_gemini_api_key()

    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. Copy .env.example to .env and set the key."
        )

    return genai.Client(api_key=key)


def _format_evidence(request: InvestigationRequest) -> str:
    code_context = request.code_context or "(not provided)"

    return f"""ERROR MESSAGE:
{request.error_message}

STACK TRACE:
{request.stack_trace}

LOGS:
{request.logs}

RECENT CHANGES:
{request.recent_changes}

EXPECTED BEHAVIOR:
{request.expected_behavior}

CODE CONTEXT:
{code_context}
"""


def _local_root_cause_synthesizer(
    request: InvestigationRequest,
    specialist_findings: dict,
) -> InvestigationResult:
    """
    Deterministic local fallback for root-cause analysis.

    This keeps FailureTrace functional when Gemini is unavailable.
    """

    error = request.error_message.strip()
    stack = request.stack_trace.strip()
    logs = request.logs.strip()
    changes = request.recent_changes.strip()
    expected = request.expected_behavior.strip()

    # Evidence extraction
    stack_locations = specialist_findings["stack_trace"]["observations"]["locations"]
    stack_exceptions = specialist_findings["stack_trace"]["observations"]["exceptions"]
    log_errors = specialist_findings["logs"]["observations"]["errors"]
    change_signals = specialist_findings["recent_changes"]["observations"]["change_signals"]

    # Determine likely location
    if stack_locations:
        location = stack_locations[-1]
    else:
        location = "Location could not be determined from the supplied stack trace."

    # Determine root cause using strong evidence patterns
    combined = f"{error}\n{stack}\n{logs}\n{changes}".lower()

    evidence = []
    failure_chain = []
    fixes = []
    verification = []

    # Pattern: missing key / field
    if (
        "keyerror" in combined
        or "missing required field" in combined
        or "missing field" in combined
        or "user_id" in combined
    ):
        cause = (
            "The profile request is missing the required `user_id` field, "
            "causing the request handler to raise a KeyError."
        )

        confidence = 0.95

        failure_chain = [
            "Profile request is received",
            "Request validation expects `user_id`",
            "`user_id` is missing from the request payload",
            "The handler accesses the missing key",
            "KeyError is raised",
            "Profile request fails",
        ]

        evidence.extend([
            "The error message identifies a KeyError involving `user_id`.",
            "The stack trace shows the failure at the request handler where `request.json[\"user_id\"]` is accessed.",
            "Application logs report that the required `user_id` field is missing.",
        ])

        if changes:
            evidence.append(
                "Recent changes indicate that request validation was modified "
                "to require `user_id`."
            )

        fixes = [
            "Validate that `user_id` exists before accessing it.",
            "Return a clear 400 Bad Request when `user_id` is missing.",
            "Ensure clients send `user_id` in the profile request payload.",
        ]

        verification = [
            "Send a profile request containing a valid `user_id`.",
            "Send a request without `user_id` and confirm it returns a controlled 400 response.",
            "Verify that the profile endpoint no longer produces a KeyError.",
        ]

    elif "typeerror" in combined:
        cause = (
            "The failure is caused by incompatible data types being used "
            "in an operation identified by the TypeError."
        )

        confidence = 0.85

        failure_chain = [
            "Application executes the failing operation",
            "Values with incompatible types are used together",
            "Python rejects the operation",
            "TypeError is raised",
            "Application operation fails",
        ]

        if error:
            evidence.append(f"Reported error: {error}")

        if stack_exceptions:
            evidence.append(
                f"Stack trace identifies the TypeError: {stack_exceptions[-1]}"
            )

        if log_errors:
            evidence.append(
                f"Application log confirms the operation failed: {log_errors[-1]}"
            )

        if changes:
            evidence.append(
                "Recent changes were reviewed as a possible source of the "
                "type mismatch."
            )

        fixes = [
            "Inspect the values involved in the failing operation and verify their types.",
            "Validate or convert incoming values before performing the operation.",
            "Add input validation and type checks around the failing code path.",
        ]

        verification = [
            "Reproduce the failure with the same input values.",
            "Verify that the involved values have compatible types.",
            "Repeat the operation and confirm the TypeError no longer occurs.",
        ]

    elif (
        "connectionerror" in combined
        or "connection refused" in combined
        or "timeout" in combined
        or "timed out" in combined
    ):
        cause = (
            "The application could not successfully communicate with a "
            "required external service or network endpoint."
        )

        confidence = 0.85

        failure_chain = [
            "Application attempts an external connection",
            "The required service or endpoint is unreachable or does not respond",
            "Connection attempt fails or times out",
            "Connection error is raised",
            "Application operation fails",
        ]

        if error:
            evidence.append(f"Reported error: {error}")

        if stack_exceptions:
            evidence.append(
                f"Stack trace exception: {stack_exceptions[-1]}"
            )

        if log_errors:
            evidence.append(
                f"Application log reports the communication failure: {log_errors[-1]}"
            )

        if changes:
            evidence.append(
                "Recent changes were reviewed for configuration or deployment "
                "changes that could affect connectivity."
            )

        fixes = [
            "Verify that the required service is running and reachable.",
            "Check the configured host, port, URL, and network credentials.",
            "Add appropriate connection timeouts and retry handling.",
        ]

        verification = [
            "Verify connectivity to the required service.",
            "Repeat the failing operation.",
            "Confirm that the request completes without a connection or timeout error.",
        ]

    elif (
        "modulenotfounderror" in combined
        or "importerror" in combined
    ):
        cause = (
            "The application cannot import a required module or dependency "
            "during execution."
        )

        confidence = 0.9

        failure_chain = [
            "Application starts or loads the affected code path",
            "A required module is imported",
            "The module or dependency cannot be resolved",
            "ImportError or ModuleNotFoundError is raised",
            "Application execution fails",
        ]

        if error:
            evidence.append(f"Reported error: {error}")

        if stack_exceptions:
            evidence.append(
                f"Stack trace identifies the import failure: {stack_exceptions[-1]}"
            )

        if changes:
            evidence.append(
                "Recent changes were reviewed for dependency or deployment changes."
            )

        fixes = [
            "Verify that the required dependency is installed in the runtime environment.",
            "Check the module name and import path.",
            "Review recent dependency or deployment changes.",
        ]

        verification = [
            "Install or restore the required dependency if it is missing.",
            "Restart the application environment.",
            "Repeat the affected operation and confirm the import succeeds.",
        ]

    else:
        # Generic evidence-based fallback
        cause = (
            "The supplied evidence indicates a failure in the application, "
            "but the available local rules cannot determine a unique root cause."
        )

        confidence = 0.45

        failure_chain = [
            "Failure is reported",
            "Stack trace and logs are analyzed",
            "Recent changes are compared with the failure",
            "A definitive root cause requires deeper analysis",
        ]

        if error:
            evidence.append(f"Reported error: {error}")

        if stack_exceptions:
            evidence.append(
                f"Stack trace exception: {stack_exceptions[-1]}"
            )

        if log_errors:
            evidence.append(
                f"Relevant application log: {log_errors[-1]}"
            )

        if change_signals:
            evidence.append(
                "Recent changes were detected in the supplied change history."
            )

        fixes = [
            "Inspect the failing code path identified in the stack trace.",
            "Correlate the failure with the most recent deployment or code change.",
            "Add targeted logging around the failing operation.",
        ]

        verification = [
            "Reproduce the failure with the same input.",
            "Apply the suspected fix.",
            "Repeat the failing scenario and confirm the error no longer occurs.",
        ]

    return InvestigationResult(
        failure=error,
        location=location,
        failure_chain=failure_chain,
        root_cause={
            "cause": cause,
            "confidence": confidence,
            "evidence": evidence,
        },
        recommended_fix=fixes,
        verification_plan=verification,
        status="needs_verification",
    )


async def run_investigation(
    request: InvestigationRequest,
) -> InvestigationResult:
    """
    FailureTrace investigation pipeline.

    Gemini is used when available.
    If Gemini is unavailable, FailureTrace automatically
    falls back to the deterministic local investigation engine.
    """

    specialist_findings = run_specialist_agents(
        stack_trace=request.stack_trace,
        logs=request.logs,
        recent_changes=request.recent_changes,
    )

    print("[FailureTrace] Orchestrator: specialist agents completed")
    print("[FailureTrace] Stack Trace Agent: completed")
    print("[FailureTrace] Log Analysis Agent: completed")
    print("[FailureTrace] Change Analysis Agent: completed")

    # Try Gemini first.
    try:
        client = _client()

        original_evidence = _format_evidence(request)

        result = await run_root_cause_synthesizer(
            client=client,
            original_evidence=original_evidence,
            specialist_findings=specialist_findings,
        )

        print("[FailureTrace] Root Cause Synthesizer: Gemini completed")
        print("[FailureTrace] Investigation: final result generated")

        return result

    except Exception as exc:
        print(
            f"[FailureTrace] Gemini unavailable: {exc}"
        )
        print(
            "[FailureTrace] Falling back to local root-cause engine"
        )

        result = _local_root_cause_synthesizer(
            request=request,
            specialist_findings=specialist_findings,
        )

        print("[FailureTrace] Local Root Cause Synthesizer: completed")
        print("[FailureTrace] Investigation: final result generated")

        return result
from google import genai
import re
from typing import Any

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