from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass

from app.models.schemas import (
    ExplainabilityDetails,
    RubricBreakdown,
    ScoreResponse,
    ValidationDetails,
)

TOKEN_PATTERN = re.compile(r"[\wáéíóúñü]+", flags=re.IGNORECASE)


@dataclass(frozen=True)
class RuleOutcome:
    rule: str
    passed: bool
    penalty: str | None = None


class AutoEITScoringEngine:
    """Deterministic rubric-style scoring engine wrapper.

    Replace `_model_features` and `_predict_subscores` with calls to your trained
    PyTorch model when ready.
    """

    def score(self, transcription: str, human_score: float | None = None) -> ScoreResponse:
        cleaned = transcription.strip()
        tokens = self._tokenize(cleaned)

        lexical = self._lexical_score(tokens)
        morph = self._morph_score(cleaned, tokens)
        semantic = self._semantic_score(cleaned, tokens)

        total = lexical + morph + semantic
        confidence = self._confidence(cleaned, tokens)

        outcomes = self._rule_outcomes(cleaned, tokens)
        penalties = [o.penalty for o in outcomes if o.penalty]
        triggered_rules = [f"{o.rule}: {'pass' if o.passed else 'fail'}" for o in outcomes]

        comparison_band = self._comparison_band(total)
        response = ScoreResponse(
            sentence=cleaned,
            score=total,
            rubric_breakdown=RubricBreakdown(
                lexical_accuracy=lexical,
                morphosyntactic_accuracy=morph,
                semantic_preservation=semantic,
            ),
            confidence=confidence,
            rubric_explanation=self._rubric_explanation(lexical, morph, semantic),
            comparison_band=comparison_band,
            explainability=ExplainabilityDetails(
                triggered_rules=triggered_rules,
                penalties=penalties,
                token_mismatches=self._token_mismatches(tokens),
                meaning_preserved=semantic >= 3,
            ),
            validation=(
                ValidationDetails(
                    agreement_percentage=max(0.0, 100 - (abs(human_score - total) / 15) * 100),
                    score_deviation=round(abs(human_score - total), 2),
                )
                if human_score is not None
                else None
            ),
        )
        return response

    def _tokenize(self, text: str) -> list[str]:
        return TOKEN_PATTERN.findall(text.lower())

    def _lexical_score(self, tokens: list[str]) -> int:
        token_count = len(tokens)
        unique_ratio = len(set(tokens)) / token_count if token_count else 0
        if token_count == 0:
            return 1
        if token_count < 4:
            return 2
        if unique_ratio < 0.45:
            return 3
        if unique_ratio < 0.7:
            return 4
        return 5

    def _morph_score(self, text: str, tokens: list[str]) -> int:
        score = 5
        if not self._has_auxiliary(tokens):
            score -= 1
        if not self._has_article_or_pronoun(tokens):
            score -= 1
        if text and text[0].islower():
            score -= 1
        if text and text[-1] not in {'.', '?', '!'}:
            score -= 1
        return max(1, score)

    def _semantic_score(self, text: str, tokens: list[str]) -> int:
        if len(tokens) <= 2:
            return 2
        if len(tokens) <= 4:
            return 3
        if any(tok in text.lower() for tok in ["porque", "aunque", "si"]):
            return 5
        return 4

    def _confidence(self, text: str, tokens: list[str]) -> float:
        stable_seed = hashlib.sha256(text.encode("utf-8")).hexdigest()
        jitter = int(stable_seed[:8], 16) % 5
        base = 0.82 + (min(len(tokens), 20) / 200)
        return round(min(0.99, base + jitter / 100), 2)

    def _has_auxiliary(self, tokens: list[str]) -> bool:
        auxiliaries = {"ha", "he", "han", "es", "fue", "era", "está", "están", "ser", "estar"}
        return any(token in auxiliaries for token in tokens)

    def _has_article_or_pronoun(self, tokens: list[str]) -> bool:
        function_words = {"el", "la", "los", "las", "un", "una", "yo", "tú", "ella", "él", "nosotros"}
        return any(token in function_words for token in tokens)

    def _rule_outcomes(self, text: str, tokens: list[str]) -> list[RuleOutcome]:
        aux_ok = self._has_auxiliary(tokens)
        agr_ok = self._has_article_or_pronoun(tokens)
        punct_ok = bool(text and text[-1] in {'.', '?', '!'})

        return [
            RuleOutcome("Auxiliary verb presence", aux_ok, None if aux_ok else "Missing auxiliary verb"),
            RuleOutcome("Agreement cue presence", agr_ok, None if agr_ok else "Potential agreement issue"),
            RuleOutcome("Sentence boundary punctuation", punct_ok, None if punct_ok else "Missing sentence-final punctuation"),
        ]

    def _token_mismatches(self, tokens: list[str]) -> list[str]:
        mismatches: list[str] = []
        if len(tokens) > 1 and tokens[0] == tokens[-1]:
            mismatches.append("Repeated token pattern suggests partial imitation")
        if len(tokens) >= 8 and len(set(tokens)) <= len(tokens) // 2:
            mismatches.append("High repetition detected")
        if not mismatches:
            mismatches.append("No major token mismatch pattern detected")
        return mismatches

    def _comparison_band(self, score: int) -> str:
        if score >= 13:
            return "Advanced"
        if score >= 10:
            return "Proficient"
        if score >= 7:
            return "Developing"
        return "Emerging"

    def _rubric_explanation(self, lexical: int, morph: int, semantic: int) -> str:
        return (
            f"Lexical control {lexical}/5, morphosyntactic control {morph}/5, "
            f"semantic preservation {semantic}/5."
        )
