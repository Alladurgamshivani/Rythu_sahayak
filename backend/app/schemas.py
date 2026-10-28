from typing import Literal

from pydantic import BaseModel, Field


DecisionAction = Literal["APPROVE", "REJECT", "RETURN_FOR_CORRECTION"]
ApplicationStatus = Literal["PENDING", "APPROVED", "REJECTED", "RETURNED"]


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=256)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str = "officer"


class DecisionRequest(BaseModel):
    action: DecisionAction
    reason: str = Field(min_length=5, max_length=1000)


class AIAnalysis(BaseModel):
    summary: str
    missing_documents: list[str]
    inconsistencies: list[str]
    suggested_action: DecisionAction
    reasons: list[str]
    uncertainties: list[str]
    analysis_source: Literal["openai", "rule_based_fallback"]
    model: str | None = None
    latency_ms: int = 0
