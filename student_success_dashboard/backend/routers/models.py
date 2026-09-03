from fastapi import APIRouter, Depends

from ..auth import require_role
from ..services import model_service

router = APIRouter(prefix="/api/models", tags=["Models"], dependencies=[Depends(require_role("teacher"))])


@router.get("/evaluate")
def evaluate():
    return model_service.evaluate_all_models()


@router.get("/feature-weights")
def feature_weights():
    """Per-variant feature importances tagged traditional vs modern."""
    return model_service.get_feature_weights()
