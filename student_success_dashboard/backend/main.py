from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import eda, models, explainability, bias, predict

app = FastAPI(
    title="Student Success Dashboard API",
    description="FastAPI backend for ML predictions, SHAP, LIME, and bias auditing",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(eda.router)
app.include_router(models.router)
app.include_router(explainability.router)
app.include_router(bias.router)
app.include_router(predict.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Student Success Dashboard API"}
