import os
import sys

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

os.environ.setdefault("APP_ENV", "development")

from backend.database import Base, get_db  # noqa: E402
from backend.main import app  # noqa: E402
from backend.auth import hash_password  # noqa: E402
from backend.db_models import StudentProfile, User  # noqa: E402
from backend.routers.auth import DEFAULT_PROFILE  # noqa: E402

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def teacher_and_student(db_session):
    """Seed one teacher with one student (with a full profile) directly in the test DB."""
    teacher = User(
        username="t1", password_hash=hash_password("pw12345"),
        role="teacher", full_name="Teacher One",
    )
    db_session.add(teacher)
    db_session.flush()

    student = User(
        username="s1", password_hash=hash_password("pw12345"),
        role="student", full_name="Student One", teacher_id=teacher.id,
    )
    db_session.add(student)
    db_session.flush()
    db_session.add(StudentProfile(student_user_id=student.id, **DEFAULT_PROFILE))
    db_session.commit()

    return {"teacher_id": teacher.id, "student_id": student.id}


def login(client, username, password):
    res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, res.text
    return res
