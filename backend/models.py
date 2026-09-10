from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str


class InvestigationRequest(BaseModel):
    error_message: str
    stack_trace: str
    logs: str
    recent_changes: str
    expected_behavior: str
    code_context: str | None = None


class RootCause(BaseModel):
    cause: str
    confidence: float = Field(description="Confidence from 0.0 to 1.0")
    evidence: list[str]


class InvestigationResult(BaseModel):
    failure: str
    location: str
    failure_chain: list[str]
    root_cause: RootCause
    recommended_fix: list[str]
    verification_plan: list[str]
    status: Literal["needs_verification"] = "needs_verification"
