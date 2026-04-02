from __future__ import annotations

import csv
import io
import json

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

from app.models.schemas import BatchScoreRecord, BatchScoreResponse, ExportRequest, ScoreRequest, ScoreResponse
from app.services.scoring_engine import AutoEITScoringEngine

router = APIRouter(prefix="/score", tags=["scoring"])
engine = AutoEITScoringEngine()


@router.get("/status")
def score_status() -> dict[str, str | bool | None]:
    return {
        "model_loaded": engine.model_available,
        "model_path": engine.model_path,
        "mode": "model" if engine.model_available else "fallback",
    }


@router.post("", response_model=ScoreResponse)
def score_transcription(payload: ScoreRequest) -> ScoreResponse:
    return engine.score(payload.transcription, payload.human_score, payload.stimulus)


@router.post("/batch", response_model=BatchScoreResponse)
async def score_batch(file: UploadFile = File(...)) -> BatchScoreResponse:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")

    body = await file.read()
    try:
        text = body.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded.") from exc

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames or "sentence_id" not in reader.fieldnames or "transcription" not in reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV must include sentence_id and transcription columns.")

    records: list[BatchScoreRecord] = []
    for row in reader:
        sid = str(row.get("sentence_id", "")).strip()
        transcription = str(row.get("transcription", "")).strip()
        stimulus = str(row.get("stimulus", "")).strip() or None
        if not sid or not transcription:
            continue
        scored = engine.score(transcription, stimulus=stimulus)
        records.append(
            BatchScoreRecord(
                sentence_id=sid,
                transcription=transcription,
                stimulus=stimulus,
                score=scored.score,
                confidence=scored.confidence,
                rubric_details=scored.model_dump(),
            )
        )

    average = round(sum(r.score for r in records) / len(records), 2) if records else 0.0
    return BatchScoreResponse(total_rows=len(records), average_score=average, records=records)


@router.post("/batch/export/csv")
def export_batch_csv(payload: ExportRequest) -> Response:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["sentence_id", "stimulus", "score", "confidence", "rubric_details"])

    for record in payload.records:
        writer.writerow([
            record.sentence_id,
            record.stimulus or "",
            record.score,
            record.confidence,
            json.dumps(record.rubric_details, ensure_ascii=False),
        ])

    csv_bytes = output.getvalue().encode("utf-8")
    headers = {"Content-Disposition": "attachment; filename=autoeit_batch_scores.csv"}
    return Response(content=csv_bytes, media_type="text/csv", headers=headers)
