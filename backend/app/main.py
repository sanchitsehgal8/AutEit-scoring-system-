from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.scoring import router as scoring_router

app = FastAPI(
    title="AutoEIT Scoring API",
    description="Automated Scoring System for Spanish Elicited Imitation Task responses.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(scoring_router)
