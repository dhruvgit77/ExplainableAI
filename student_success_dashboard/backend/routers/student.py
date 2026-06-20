import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import require_role
from ..database import get_db
from ..db_models import Report, User

router = APIRouter(prefix="/api/student", tags=["Student"])


@router.get("/me/report")
def my_report(student: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    report = (
        db.query(Report)
        .filter(Report.student_user_id == student.id)
        .order_by(Report.generated_at.desc())
        .first()
    )
    if not report:
        return {"has_report": False}

    return {
        "has_report": True,
        "generated_at": report.generated_at.isoformat(),
        "profile_snapshot": json.loads(report.profile_snapshot_json),
        "result": json.loads(report.result_json),
    }
