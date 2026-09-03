from fastapi import APIRouter, Depends

from ..auth import require_role
from ..services import bias_service

router = APIRouter(prefix="/api/bias", tags=["Bias Audit"], dependencies=[Depends(require_role("teacher"))])


@router.get("/audit")
def audit():
    return bias_service.audit_bias()
