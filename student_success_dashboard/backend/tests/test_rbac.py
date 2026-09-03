from .conftest import login
from backend.routers.auth import DEFAULT_PROFILE


def test_unauthenticated_requests_are_rejected(client):
    assert client.get("/api/eda/summary").status_code == 401
    assert client.get("/api/models/evaluate").status_code == 401
    assert client.get("/api/bias/audit").status_code == 401
    assert client.get("/api/teacher/students").status_code == 401
    assert client.get("/api/student/me/report").status_code == 401
    # Use a fully valid body so the assertion targets the auth check, not body validation.
    assert client.post("/api/predict", json=DEFAULT_PROFILE).status_code == 401


def test_student_cannot_access_teacher_routes(client, teacher_and_student):
    login(client, "s1", "pw12345")
    assert client.get("/api/teacher/students").status_code == 403
    assert client.get("/api/eda/summary").status_code == 403


def test_teacher_cannot_access_other_teachers_students(client, db_session, teacher_and_student):
    from backend.auth import hash_password
    from backend.db_models import User

    other_teacher = User(
        username="t2", password_hash=hash_password("pw12345"),
        role="teacher", full_name="Teacher Two",
    )
    db_session.add(other_teacher)
    db_session.commit()

    login(client, "t2", "pw12345")
    res = client.get(f"/api/teacher/students/{teacher_and_student['student_id']}")
    assert res.status_code == 404


def test_teacher_can_access_own_student(client, teacher_and_student):
    login(client, "t1", "pw12345")
    res = client.get(f"/api/teacher/students/{teacher_and_student['student_id']}")
    assert res.status_code == 200
    assert res.json()["username"] == "s1"


def test_student_sees_only_their_own_report(client, teacher_and_student):
    login(client, "s1", "pw12345")
    res = client.get("/api/student/me/report")
    assert res.status_code == 200
    assert res.json() == {"has_report": False}
