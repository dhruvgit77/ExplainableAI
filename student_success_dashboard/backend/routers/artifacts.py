"""Real Tier-3 agentic extraction from uploaded student work.

POST /api/artifacts/extract  (teacher-only, multipart)
  files:   one or more of the student's submissions (PDF / image / report / code)
  profile: OPTIONAL JSON string of the Tier-1/Tier-2 record. When supplied, the
           measured Tier-3 features are merged with it and the Full model produces
           a prediction + SHAP explanation.

The Tier-3 features here are MEASURED from the actual artifacts by the OpenAI
agent mesh — not estimated. Requires OPENAI_API_KEY on the server.
"""
import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from typing import List, Optional

from ..auth import require_role
from ..services import (
    agentic_extraction_service, model_service, shap_service,
)
from ..services.artifact_agents import ExtractionUnavailable

router = APIRouter(prefix="/api/artifacts", tags=["Artifacts"])

# 15 MB per file guard.
MAX_BYTES = 15 * 1024 * 1024


@router.get("/status")
def extraction_status(_user=Depends(require_role("teacher"))):
    """Tells the UI whether the real OpenAI pipeline is available (OPENAI_API_KEY present)."""
    import os
    return {"available": bool(os.environ.get("OPENAI_API_KEY"))}


@router.post("/extract")
async def extract(
    files: List[UploadFile] = File(...),
    profile: Optional[str] = Form(None),
    _user=Depends(require_role("teacher")),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    artifacts = []
    for f in files:
        data = await f.read()
        if len(data) == 0:
            continue
        if len(data) > MAX_BYTES:
            raise HTTPException(status_code=413, detail=f"{f.filename} exceeds the 15 MB limit.")
        artifacts.append({"filename": f.filename, "data": data})

    if not artifacts:
        raise HTTPException(status_code=400, detail="Uploaded files were empty.")

    # ── Run the real agent mesh ──────────────────────────────────────────────
    try:
        agentic = agentic_extraction_service.extract_from_artifacts(
            student_id=str(_user.id), artifacts=artifacts,
        )
    except ExtractionUnavailable as e:
        # No API key / SDK missing — clear, actionable 503.
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:  # pragma: no cover - surface model/API errors cleanly
        raise HTTPException(status_code=502, detail=f"Extraction failed: {e}")

    response = {
        "agentic_features": agentic,
        "source": "measured",
        "files": [a["filename"] for a in artifacts],
    }

    # ── Optional: full prediction when a Tier-1/2 profile is provided ─────────
    if profile:
        try:
            base = json.loads(profile)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="profile must be valid JSON.")

        input_data = {**base, **agentic}
        prediction = model_service.predict_student(input_data)
        variant = model_service.PRODUCTION_VARIANT
        prediction["shap"] = shap_service.get_shap_for_input(
            prediction["processed_features"], variant
        )
        prediction.pop("processed_features", None)
        response["prediction"] = prediction

    return response
