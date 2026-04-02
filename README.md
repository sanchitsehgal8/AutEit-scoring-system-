# AutoEIT: Automated Scoring System for Spanish EIT Responses

Research-grade prototype for rubric-aligned, deterministic scoring of Spanish Elicited Imitation Task (EIT) transcriptions.

## What this prototype includes

- **FastAPI backend** with deterministic scoring endpoints
- **React + Vite + Tailwind frontend** with a dark academic UI
- **Single-sentence scoring** and **CSV batch scoring**
- **Rubric breakdown and explainability panel**
- **Researcher dashboard** with core metrics and histogram
- **Exports**: CSV, JSON, PDF

## Project structure

```text
backend/
	app/
		main.py
		models/schemas.py
		routes/scoring.py
		services/scoring_engine.py
	requirements.txt

frontend/
	src/
		components/
		pages/
		lib/api.ts
		types/scoring.ts
		App.tsx
```

## Backend API

### Health check
- `GET /health`

### Single scoring
- `POST /score`
- Input:
	```json
	{
		"transcription": "string",
		"human_score": 11
	}
	```
- Output includes:
	- `score`
	- `rubric_breakdown`
	- `confidence`
	- `explainability`
	- optional validation against `human_score`

### Batch scoring
- `POST /score/batch` (multipart/form-data)
- Upload CSV with columns:
	- `sentence_id`
	- `transcription`

### Batch CSV export
- `POST /score/batch/export/csv`

## Run locally

### 1) Backend

```bash
cd backend
/opt/homebrew/bin/python3.11 -m pip install -r requirements.txt
/opt/homebrew/bin/python3.11 -m uvicorn app.main:app --reload --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and backend at `http://localhost:8000`.

## Notes on model integration

The scoring service is intentionally modular:

- Replace scoring logic in `backend/app/services/scoring_engine.py` with your trained PyTorch inference pipeline.
- Keep output format stable so UI and exports continue to work.
- Deterministic behavior is preserved in the current implementation for reproducible demos.
- Optional adapter is already wired:
	- Set `AUTOEIT_MODEL_PATH` to a local TorchScript (`.pt`) model file.
	- If model loading fails or no model is provided, backend automatically uses deterministic fallback scoring.

Example:

```bash
cd backend
AUTOEIT_MODEL_PATH=/absolute/path/to/autoeit_model.pt /opt/homebrew/bin/python3.11 -m uvicorn app.main:app --reload --port 8000
```

## Minimal batch CSV example

```csv
sentence_id,transcription
S1,Yo he ido a la escuela.
S2,Ella está cantando en casa.
```