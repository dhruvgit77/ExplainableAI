from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from ..services import model_service, shap_service, lime_service

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
    financial_stress: int
    num_subjects: int
    study_hours_per_week: float
    attendance_rate: float
    sleep_hours_avg: float
    extracurricular_count: int
    prev_cgpa: float
    internal_marks_pct: float
    assignment_completion_pct: float
    # ── Modern AI-usage features (real survey-based) ──
    ai_reliance: int                  # Likert 1-5: relies heavily on AI
    independent_after_ai: int         # Likert 1-5: can solve independently after AI
    ai_anxiety: int                   # Likert 1-5: anxious without AI
    verify_ai_answers: int            # Likert 1-5: verifies AI output
    reduced_thinking_effort: int      # Likert 1-5: AI reduced thinking effort
    ai_assignment_pct: float          # % of assignments done with AI
    multitask_studying: int           # 1-4: multitasks on phone while studying
    shortform_consumption: int        # 1-4: consumes short-form content
    doomscroll_sleep: int             # 1-4: doomscrolls before sleeping
    nonstudy_screen_time: float       # daily non-study screen hours
    ai_usage_frequency: str           # Never / 1-3/day / 3-5/day / 5+/day


# Backwards-compatible aliases.
PredictRequest = StudentProfile
CounterfactualRequest = StudentProfile


class BatchPredictRequest(BaseModel):
    records: List[dict]
    model_name: str = "Combined"


@router.post("/predict")
def predict(req: PredictRequest):
    input_data = req.model_dump()
    prediction = model_service.predict_student(input_data)

    shap_explanation = shap_service.get_shap_for_input(
        prediction["processed_features"], "Combined"
    )
    lime_explanation = lime_service.get_lime_for_input(
        prediction["processed_features"], "Combined"
    )

    return {
        **prediction,
        "shap": shap_explanation,
        "lime": lime_explanation,
    }


@router.post("/predict/batch")
def predict_batch(req: BatchPredictRequest):
    return model_service.predict_batch(req.records, req.model_name)


@router.post("/predict/counterfactual")
def counterfactual(req: CounterfactualRequest):
    input_data = req.model_dump()
    return model_service.get_counterfactual(input_data)


@router.get("/models/list")
def list_models():
    return {"models": model_service.get_all_model_names()}
