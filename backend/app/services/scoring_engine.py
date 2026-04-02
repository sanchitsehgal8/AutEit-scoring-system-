from __future__ import annotations

import hashlib
import os
import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from importlib import import_module
from importlib.util import find_spec
from typing import Any

_torch_spec = find_spec("torch")
torch = import_module("torch") if _torch_spec else None

from app.models.schemas import (
    ExplainabilityDetails,
    RubricBreakdown,
    ScoreResponse,
    ValidationDetails,
)

TOKEN_PATTERN = re.compile(r"[\wáéíóúñü]+", flags=re.IGNORECASE)
SPANISH_HINTS = {
    "de", "la", "que", "el", "en", "y", "a", "los", "se", "del", "las", "por", "un", "para",
    "con", "no", "una", "su", "al", "lo", "como", "más", "pero", "sus", "le", "ya", "o", "este",
    "sí", "porque", "cuando", "muy", "sin", "sobre", "también", "me", "hasta", "hay",
}


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

    def __init__(self, model_path: str | None = None) -> None:
        self.model_path = model_path or os.getenv("AUTOEIT_MODEL_PATH")
        self.model: Any = None
        self.model_available = False
        self._load_model()

    def score(
        self,
        transcription: str,
        human_score: float | None = None,
        stimulus: str | None = None,
    ) -> ScoreResponse:
        cleaned = transcription.strip()
        tokens = self._tokenize(cleaned)
        cleaned_stimulus = stimulus.strip() if stimulus else None
        spanish_signal = self._spanish_signal(cleaned, tokens)
        has_stimulus = bool(cleaned_stimulus)

        predicted_subscores = self._predict_subscores(cleaned, tokens)
        used_model = predicted_subscores is not None
        if predicted_subscores and not has_stimulus:
            lexical, morph, semantic = predicted_subscores
        elif has_stimulus and cleaned_stimulus:
            lexical, morph, semantic = self._reference_scores(cleaned_stimulus, cleaned)
        else:
            lexical = self._lexical_score(tokens)
            morph = self._morph_score(cleaned, tokens)
            semantic = self._semantic_score(cleaned, tokens)

        lexical, morph, semantic = self._apply_language_guard(
            lexical,
            morph,
            semantic,
            spanish_signal=spanish_signal,
            has_stimulus=has_stimulus,
        )

        total = lexical + morph + semantic
        confidence = self._confidence(cleaned, tokens, used_model and not has_stimulus, spanish_signal, has_stimulus)

        outcomes = self._rule_outcomes(cleaned, tokens)
        penalties = [o.penalty for o in outcomes if o.penalty]
        if spanish_signal < 0.20:
            penalties.append("Non-Spanish response pattern detected")
        triggered_rules = [f"{o.rule}: {'pass' if o.passed else 'fail'}" for o in outcomes]
        triggered_rules.append(f"Model adapter: {'active' if used_model and not has_stimulus else 'fallback'}")
        triggered_rules.append(f"Stimulus-aware scoring: {'active' if has_stimulus else 'off'}")
        triggered_rules.append(f"Spanish signal: {round(spanish_signal, 2)}")

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
            rubric_explanation=self._rubric_explanation(lexical, morph, semantic, has_stimulus),
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

    def _reference_scores(self, stimulus: str, response: str) -> tuple[int, int, int]:
        target_tokens = self._tokenize(stimulus)
        response_tokens = self._tokenize(response)
        if not target_tokens or not response_tokens:
            return 1, 1, 1

        target_set = set(target_tokens)
        response_set = set(response_tokens)
        overlap = len(target_set & response_set) / max(1, len(target_set))
        edit_ratio = SequenceMatcher(None, stimulus.lower(), response.lower()).ratio()
        semantic_proxy = min(1.0, 0.65 * overlap + 0.35 * edit_ratio)

        lexical = max(1, min(5, int(round(1 + 4 * overlap))))
        morph = max(1, min(5, int(round(1 + 4 * edit_ratio))))
        semantic = max(1, min(5, int(round(1 + 4 * semantic_proxy))))
        return lexical, morph, semantic

    def _spanish_signal(self, text: str, tokens: list[str]) -> float:
        if not tokens:
            return 0.0
        hint_hits = sum(1 for token in tokens if token in SPANISH_HINTS)
        diacritic_hits = sum(1 for char in text.lower() if char in "áéíóúñü")
        ratio = hint_hits / len(tokens)
        diacritic_bonus = min(0.2, diacritic_hits / max(1, len(text)))
        return min(1.0, ratio + diacritic_bonus)

    def _apply_language_guard(
        self,
        lexical: int,
        morph: int,
        semantic: int,
        *,
        spanish_signal: float,
        has_stimulus: bool,
    ) -> tuple[int, int, int]:
        if spanish_signal >= 0.20:
            return lexical, morph, semantic

        # Strong clamp for likely non-Spanish responses, especially when no reference stimulus is provided.
        if not has_stimulus:
            return 1, min(1, morph), 1
        return min(3, lexical), min(2, morph), min(2, semantic)

    def _load_model(self) -> None:
        if not self.model_path or torch is None:
            return
        try:
            model = torch.jit.load(self.model_path, map_location="cpu")
            model.eval()
            self.model = model
            self.model_available = True
            return
        except Exception:
            pass

        try:
            loaded = torch.load(self.model_path, map_location="cpu")
            if hasattr(loaded, "eval"):
                loaded.eval()
                self.model = loaded
                self.model_available = True
        except Exception:
            self.model = None
            self.model_available = False

    def _predict_subscores(self, text: str, tokens: list[str]) -> tuple[int, int, int] | None:
        if not self.model_available or torch is None:
            return None

        try:
            with torch.no_grad():
                features = self._model_features(text, tokens)
                raw = self.model(features)
            return self._normalize_model_output(raw)
        except Exception:
            return None

    def _model_features(self, text: str, tokens: list[str]):
        token_count = len(tokens)
        unique_ratio = len(set(tokens)) / token_count if token_count else 0.0
        aux = 1.0 if self._has_auxiliary(tokens) else 0.0
        agr = 1.0 if self._has_article_or_pronoun(tokens) else 0.0
        punct = 1.0 if (text and text[-1] in {'.', '?', '!'}) else 0.0
        sem_hint = 1.0 if any(tok in text.lower() for tok in ["porque", "aunque", "si"]) else 0.0

        vector = [
            min(token_count / 20, 1.0),
            unique_ratio,
            aux,
            agr,
            punct,
            sem_hint,
        ]
        return torch.tensor([vector], dtype=torch.float32)

    def _normalize_model_output(self, raw: Any) -> tuple[int, int, int] | None:
        values: list[float] | None = None

        if torch is not None and isinstance(raw, torch.Tensor):
            values = raw.detach().cpu().reshape(-1).tolist()
        elif isinstance(raw, (list, tuple)):
            values = [float(v) for v in raw]
        elif isinstance(raw, dict):
            keys = ("lexical_accuracy", "morphosyntactic_accuracy", "semantic_preservation")
            if all(key in raw for key in keys):
                values = [float(raw[key]) for key in keys]

        if not values or len(values) < 3:
            return None

        lexical = int(round(max(1.0, min(5.0, values[0]))))
        morph = int(round(max(1.0, min(5.0, values[1]))))
        semantic = int(round(max(1.0, min(5.0, values[2]))))
        return lexical, morph, semantic

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

    def _confidence(
        self,
        text: str,
        tokens: list[str],
        used_model: bool,
        spanish_signal: float,
        has_stimulus: bool,
    ) -> float:
        stable_seed = hashlib.sha256(text.encode("utf-8")).hexdigest()
        jitter = int(stable_seed[:8], 16) % 5
        base = 0.88 if has_stimulus else (0.86 if used_model else 0.82)
        if spanish_signal < 0.20:
            base -= 0.15
        base += min(len(tokens), 20) / 200
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

    def _rubric_explanation(self, lexical: int, morph: int, semantic: int, has_stimulus: bool) -> str:
        mode = "stimulus-aware" if has_stimulus else "transcription-only"
        return (
            f"Mode: {mode}. "
            f"Lexical control {lexical}/5, morphosyntactic control {morph}/5, "
            f"semantic preservation {semantic}/5."
        )
