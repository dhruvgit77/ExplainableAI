from fastapi import APIRouter
from pydantic import BaseModel
from ..services import shap_service, lime_service

router = APIRouter(prefix="/api/xai", tags=["Explainability"])


class LocalRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    student_index: int
    model_name: str = "XGBoost"


@router.get("/shap/global")
def shap_global(model_name: str = "XGBoost"):
    return shap_service.get_global_shap(model_name)


@router.get("/shap/dependence")
def shap_dependence(model_name: str = "XGBoost", top_n: int = 6):
    return shap_service.get_shap_dependence(model_name, top_n)


@router.post("/shap/local")
def shap_local(req: LocalRequest):
    return shap_service.get_local_shap(req.student_index, req.model_name)


@router.post("/lime/local")
def lime_local(req: LocalRequest):
    return lime_service.get_local_lime(req.student_index, req.model_name)
