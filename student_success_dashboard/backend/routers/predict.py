from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from ..services import model_service, shap_service, lime_service

router = APIRouter(prefix="/api", tags=["Predict"])


class PredictRequest(BaseModel):
    """Indian student academic profile for prediction."""
    gender: str
    region: str
    board_type: str
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


class BatchPredictRequest(BaseModel):
    records: List[dict]
    model_name: str = "XGBoost"


class CounterfactualRequest(BaseModel):
    """Same fields as PredictRequest, for counterfactual analysis."""
    gender: str
    region: str
    board_type: str
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


@router.post("/predict")
def predict(req: PredictRequest):
    input_data = req.model_dump()
    prediction = model_service.predict_student(input_data)

    shap_explanation = shap_service.get_shap_for_input(
        prediction["processed_features"], "XGBoost"
    )
    lime_explanation = lime_service.get_lime_for_input(
        prediction["processed_features"], "XGBoost"
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
