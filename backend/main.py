from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

from backend.agent import run_investigation
from backend.models import HealthResponse, InvestigationRequest, InvestigationResult

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app = FastAPI(title="FailureTrace")

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


@app.post("/investigate", response_model=InvestigationResult)
async def investigate(request: InvestigationRequest) -> InvestigationResult:
    try:
        return await run_investigation(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Investigation failed: {exc}",
        ) from exc
