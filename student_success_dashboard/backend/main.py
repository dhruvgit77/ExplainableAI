from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, SessionLocal, engine
from .routers import eda, models, explainability, bias, predict, auth, teacher, student, news, artifacts
from .seed import seed_initial_data

app = FastAPI(
    title="Student Success Dashboard API",
    description="FastAPI backend for ML predictions, SHAP, LIME, and bias auditing",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(eda.router)
app.include_router(models.router)
app.include_router(explainability.router)
app.include_router(bias.router)
app.include_router(predict.router)
app.include_router(auth.router)
app.include_router(teacher.router)
app.include_router(student.router)
app.include_router(news.router)
app.include_router(artifacts.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"status": "ok", "message": "Student Success Dashboard API"}
