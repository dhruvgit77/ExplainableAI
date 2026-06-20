from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import create_access_token, get_current_user, hash_password, verify_password
from ..database import get_db
from ..db_models import StudentProfile, User

router = APIRouter(prefix="/api/auth", tags=["Auth"])


# Sensible mid-range starting values for a freshly registered student.
# The teacher is expected to review and correct these before generating a report.
DEFAULT_PROFILE = {
    "gender": "Male", "region": "North", "degree_type": "B.Tech",
    "parent_education": "Graduate", "medium_of_instruction": "English",
    "internet_quality": "4G/Good", "coaching_enrolled": "No",
    "financial_stress": 5, "num_subjects": 6, "study_hours_per_week": 15.0,
    "attendance_rate": 80.0, "sleep_hours_avg": 7.0, "extracurricular_count": 2,
    "prev_cgpa": 7.0, "internal_marks_pct": 70.0, "assignment_completion_pct": 75.0,
    "ai_reliance": 3, "independent_after_ai": 3, "ai_anxiety": 3,
    "verify_ai_answers": 3, "reduced_thinking_effort": 3, "ai_assignment_pct": 50.0,
    "multitask_studying": 2, "shortform_consumption": 2, "doomscroll_sleep": 2,
    "nonstudy_screen_time": 3.0, "ai_usage_frequency": "3-5/day",
}


class LoginRequest(BaseModel):
    username: str
    password: str


class SignupRequest(BaseModel):
    username: str
    password: str
    full_name: str
    role: str  # "teacher" | "student"
    teacher_id: Optional[int] = None


def _auth_payload(user: User) -> dict:
    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.full_name,
    }


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    return _auth_payload(user)


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    username = req.username.strip()
    full_name = req.full_name.strip()
    if not username or not req.password or not full_name:
        raise HTTPException(status_code=400, detail="Username, password and full name are required")
    if req.role not in ("teacher", "student"):
        raise HTTPException(status_code=400, detail="Role must be 'teacher' or 'student'")
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=409, detail="That username is already taken")

    teacher_id = None
    if req.role == "student":
        if req.teacher_id is None:
            raise HTTPException(status_code=400, detail="Please choose your teacher")
        teacher = db.query(User).filter(User.id == req.teacher_id, User.role == "teacher").first()
        if not teacher:
            raise HTTPException(status_code=400, detail="Selected teacher does not exist")
        teacher_id = teacher.id

    user = User(
        username=username,
        password_hash=hash_password(req.password),
        role=req.role,
        full_name=full_name,
        teacher_id=teacher_id,
    )
    db.add(user)
    db.flush()  # get user.id

    if req.role == "student":
        db.add(StudentProfile(student_user_id=user.id, **DEFAULT_PROFILE))

    db.commit()
    db.refresh(user)
    return _auth_payload(user)


@router.get("/teachers")
def list_teachers(db: Session = Depends(get_db)):
    """Public list of teachers, used to populate the student signup dropdown."""
    teachers = db.query(User).filter(User.role == "teacher").order_by(User.full_name).all()
    return [{"id": t.id, "name": t.full_name, "username": t.username} for t in teachers]


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"user_id": user.id, "role": user.role, "name": user.full_name, "username": user.username}
