from fastapi import APIRouter
from ..services import model_service

router = APIRouter(prefix="/api/models", tags=["Models"])


@router.get("/evaluate")
def evaluate():
    return model_service.evaluate_all_models()
