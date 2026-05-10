from fastapi import APIRouter
from ..services import bias_service

router = APIRouter(prefix="/api/bias", tags=["Bias Audit"])


@router.get("/audit")
def audit():
    return bias_service.audit_bias()
