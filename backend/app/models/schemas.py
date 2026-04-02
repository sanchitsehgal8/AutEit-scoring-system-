from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ScoreRequest(BaseModel):
    transcription: str = Field(..., min_length=1)
    stimulus: str | None = None
    human_score: float | None = None


class RubricBreakdown(BaseModel):
    lexical_accuracy: int
    morphosyntactic_accuracy: int
    semantic_preservation: int


class ExplainabilityDetails(BaseModel):
    triggered_rules: list[str]
    penalties: list[str]
    token_mismatches: list[str]
    meaning_preserved: bool


class ValidationDetails(BaseModel):
    agreement_percentage: float
    score_deviation: float


class ScoreResponse(BaseModel):
    sentence: str
    score: int
    rubric_breakdown: RubricBreakdown
    confidence: float
    rubric_explanation: str
    comparison_band: str
    explainability: ExplainabilityDetails
    validation: ValidationDetails | None = None


class BatchScoreRecord(BaseModel):
    sentence_id: str
    transcription: str
    stimulus: str | None = None
    score: int
    confidence: float
    rubric_details: dict[str, Any]


class BatchScoreResponse(BaseModel):
    total_rows: int
    average_score: float
    records: list[BatchScoreRecord]


class ExportRequest(BaseModel):
    records: list[BatchScoreRecord]
