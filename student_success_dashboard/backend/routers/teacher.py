import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_role
from ..database import get_db
from ..db_models import Report, StudentProfile as StudentProfileDB, User
from ..services import lime_service, model_service, shap_service
from .predict import StudentProfile as StudentProfileSchema

router = APIRouter(prefix="/api/teacher", tags=["Teacher"])


def _get_student_or_404(db: Session, teacher: User, student_id: int) -> User:
    student = (
        db.query(User)
        .filter(User.id == student_id, User.teacher_id == teacher.id, User.role == "student")
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found in your class")
    return student


def _latest_report(db: Session, student_user_id: int):
    return (
        db.query(Report)
        .filter(Report.student_user_id == student_user_id)
        .order_by(Report.generated_at.desc())
        .first()
    )


@router.get("/students")
def list_students(teacher: User = Depends(require_role("teacher")), db: Session = Depends(get_db)):
    students = db.query(User).filter(User.teacher_id == teacher.id, User.role == "student").all()
    out = []
    for s in students:
        report = _latest_report(db, s.id)
        out.append({
            "id": s.id,
            "username": s.username,
            "name": s.full_name,
            "latest_class": report.predicted_class if report else None,
            "latest_confidence": report.confidence if report else None,
            "last_updated": report.generated_at.isoformat() if report else None,
        })
    return out


@router.get("/students/{student_id}")
def get_student(student_id: int, teacher: User = Depends(require_role("teacher")), db: Session = Depends(get_db)):
    student = _get_student_or_404(db, teacher, student_id)
    profile = db.query(StudentProfileDB).filter(StudentProfileDB.student_user_id == student.id).first()
    report = _latest_report(db, student.id)
    return {
        "id": student.id,
        "username": student.username,
        "name": student.full_name,
        "profile": profile.to_dict() if profile else None,
        "latest_report": _serialize_report(report) if report else None,
    }


@router.put("/students/{student_id}")
def update_student(
    student_id: int,
    req: StudentProfileSchema,
    teacher: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db),
):
    student = _get_student_or_404(db, teacher, student_id)
    profile = db.query(StudentProfileDB).filter(StudentProfileDB.student_user_id == student.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student has no profile record")

    for field, value in req.model_dump().items():
        setattr(profile, field, value)
    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "ok", "profile": profile.to_dict()}


def _serialize_report(report: Report):
    return {
        "id": report.id,
        "generated_at": report.generated_at.isoformat(),
        "predicted_class": report.predicted_class,
        "confidence": report.confidence,
        "profile_snapshot": json.loads(report.profile_snapshot_json),
        "result": json.loads(report.result_json),
    }


@router.post("/students/{student_id}/generate-report")
def generate_report(
    student_id: int,
    teacher: User = Depends(require_role("teacher")),
    db: Session = Depends(get_db),
):
    student = _get_student_or_404(db, teacher, student_id)
    profile = db.query(StudentProfileDB).filter(StudentProfileDB.student_user_id == student.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student has no profile record")

    input_data = profile.to_dict()
    prediction = model_service.predict_student(input_data)
    shap_explanation = shap_service.get_shap_for_input(prediction["processed_features"], "Combined")
    lime_explanation = lime_service.get_lime_for_input(prediction["processed_features"], "Combined")

    result = {**prediction, "shap": shap_explanation, "lime": lime_explanation}
    result.pop("processed_features", None)

    report = Report(
        student_user_id=student.id,
        generated_by_teacher_id=teacher.id,
        predicted_class=result["predicted_class"],
        confidence=result["confidence"],
        profile_snapshot_json=json.dumps(input_data),
        result_json=json.dumps(result),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return _serialize_report(report)
