from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


def _now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "teacher" | "student"
    full_name = Column(String, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    profile = relationship(
        "StudentProfile", back_populates="student", uselist=False,
        foreign_keys="StudentProfile.student_user_id",
    )


class StudentProfile(Base):
    """Mirrors the StudentProfile pydantic model in routers/predict.py."""

    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Traditional features
    gender = Column(String, nullable=False)
    region = Column(String, nullable=False)
    degree_type = Column(String, nullable=False)
    parent_education = Column(String, nullable=False)
    medium_of_instruction = Column(String, nullable=False)
    internet_quality = Column(String, nullable=False)
    coaching_enrolled = Column(String, nullable=False)
    financial_stress = Column(Integer, nullable=False)
    num_subjects = Column(Integer, nullable=False)
    study_hours_per_week = Column(Float, nullable=False)
    attendance_rate = Column(Float, nullable=False)
    sleep_hours_avg = Column(Float, nullable=False)
    extracurricular_count = Column(Integer, nullable=False)
    prev_cgpa = Column(Float, nullable=False)
    internal_marks_pct = Column(Float, nullable=False)
    assignment_completion_pct = Column(Float, nullable=False)

    # Modern AI-usage features (real survey-based)
    ai_reliance = Column(Integer, nullable=False)
    independent_after_ai = Column(Integer, nullable=False)
    ai_anxiety = Column(Integer, nullable=False)
    verify_ai_answers = Column(Integer, nullable=False)
    reduced_thinking_effort = Column(Integer, nullable=False)
    ai_assignment_pct = Column(Float, nullable=False)
    multitask_studying = Column(Integer, nullable=False)
    shortform_consumption = Column(Integer, nullable=False)
    doomscroll_sleep = Column(Integer, nullable=False)
    nonstudy_screen_time = Column(Float, nullable=False)
    ai_usage_frequency = Column(String, nullable=False)

    updated_at = Column(DateTime, default=_now, onupdate=_now)

    student = relationship("User", foreign_keys=[student_user_id])

    PROFILE_FIELDS = [
        "gender", "region", "degree_type", "parent_education", "medium_of_instruction",
        "internet_quality", "coaching_enrolled", "financial_stress", "num_subjects",
        "study_hours_per_week", "attendance_rate", "sleep_hours_avg", "extracurricular_count",
        "prev_cgpa", "internal_marks_pct", "assignment_completion_pct",
        "ai_reliance", "independent_after_ai", "ai_anxiety", "verify_ai_answers",
        "reduced_thinking_effort", "ai_assignment_pct", "multitask_studying",
        "shortform_consumption", "doomscroll_sleep", "nonstudy_screen_time",
        "ai_usage_frequency",
    ]

    def to_dict(self):
        return {f: getattr(self, f) for f in self.PROFILE_FIELDS}


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    student_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    generated_by_teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    generated_at = Column(DateTime, default=_now, index=True)

    predicted_class = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    profile_snapshot_json = Column(Text, nullable=False)
    result_json = Column(Text, nullable=False)
