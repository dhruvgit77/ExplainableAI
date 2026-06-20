from fastapi import APIRouter
from ..services import model_service

router = APIRouter(prefix="/api/models", tags=["Models"])


@router.get("/evaluate")
def evaluate():
    return model_service.evaluate_all_models()


@router.get("/feature-weights")
def feature_weights():
    """Per-variant feature importances tagged traditional vs modern."""
    return model_service.get_feature_weights()
