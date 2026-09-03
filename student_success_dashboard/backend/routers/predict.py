from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import List

from ..auth import require_role
from ..services import (
    model_service, shap_service, lime_service, agentic_extraction_service,
)

router = APIRouter(prefix="/api", tags=["Predict"])


class StudentProfile(BaseModel):
    """Indian student profile: traditional academic + modern AI-usage features."""
    # ── Traditional features ──
    gender: str
    region: str
    degree_type: str
    parent_education: str
    medium_of_instruction: str
    internet_quality: str
    coaching_enrolled: str
    financial_stress: int = Field(ge=1, le=10)
    num_subjects: int = Field(ge=1, le=15)
    study_hours_per_week: float = Field(ge=0, le=100)
    attendance_rate: float = Field(ge=0, le=100)
    sleep_hours_avg: float = Field(ge=0, le=24)
    extracurricular_count: int = Field(ge=0, le=20)
    prev_cgpa: float = Field(ge=0, le=10)
    internal_marks_pct: float = Field(ge=0, le=100)
    assignment_completion_pct: float = Field(ge=0, le=100)
    # ── Modern AI-usage features (real survey-based) ──
    ai_reliance: int = Field(ge=1, le=5)                  # Likert 1-5: relies heavily on AI
    independent_after_ai: int = Field(ge=1, le=5)         # Likert 1-5: can solve independently after AI
    ai_anxiety: int = Field(ge=1, le=5)                   # Likert 1-5: anxious without AI
    verify_ai_answers: int = Field(ge=1, le=5)            # Likert 1-5: verifies AI output
    reduced_thinking_effort: int = Field(ge=1, le=5)      # Likert 1-5: AI reduced thinking effort
    ai_assignment_pct: float = Field(ge=0, le=100)        # % of assignments done with AI
    multitask_studying: int = Field(ge=1, le=4)           # 1-4: multitasks on phone while studying
    shortform_consumption: int = Field(ge=1, le=4)        # 1-4: consumes short-form content
    doomscroll_sleep: int = Field(ge=1, le=4)             # 1-4: doomscrolls before sleeping
    nonstudy_screen_time: float = Field(ge=0, le=24)      # daily non-study screen hours
    ai_usage_frequency: str           # Never / 1-3/day / 3-5/day / 5+/day


# Backwards-compatible aliases.
PredictRequest = StudentProfile
CounterfactualRequest = StudentProfile


class BatchPredictRequest(BaseModel):
    records: List[dict]
    model_name: str = model_service.PRODUCTION_VARIANT


@router.post("/predict")
def predict(req: PredictRequest, _user=Depends(require_role("teacher"))):
    # Teacher enters Tier 1+2; the agentic Tier-3 features are auto-extracted here
    # so the response can surface what the system "measured" from the student.
    raw = req.model_dump()
    agentic = agentic_extraction_service.estimate_from_record(raw)
    input_data = {**raw, **agentic}

    prediction = model_service.predict_student(input_data)

    variant = model_service.PRODUCTION_VARIANT
    shap_explanation = shap_service.get_shap_for_input(
        prediction["processed_features"], variant
    )
    lime_explanation = lime_service.get_lime_for_input(
        prediction["processed_features"], variant
    )

    return {
        **prediction,
        "agentic_features": agentic,
        "shap": shap_explanation,
        "lime": lime_explanation,
    }


@router.post("/predict/batch")
def predict_batch(req: BatchPredictRequest, _user=Depends(require_role("teacher"))):
    return model_service.predict_batch(req.records, req.model_name)


@router.post("/predict/counterfactual")
def counterfactual(req: CounterfactualRequest, _user=Depends(require_role("teacher"))):
    input_data = req.model_dump()
    return model_service.get_counterfactual(input_data)


@router.get("/models/list")
def list_models():
    return {"models": model_service.get_all_model_names()}
