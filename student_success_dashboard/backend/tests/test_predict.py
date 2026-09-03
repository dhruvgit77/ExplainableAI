from .conftest import login
from backend.routers.auth import DEFAULT_PROFILE


def test_predict_as_teacher_returns_valid_prediction(client, teacher_and_student):
    login(client, "t1", "pw12345")
    res = client.post("/api/predict", json=DEFAULT_PROFILE)
    assert res.status_code == 200
    body = res.json()
    assert body["predicted_class"] in ("Fail", "At-Risk", "Pass")
    assert abs(sum(body["probabilities"].values()) - 1.0) < 1e-2
    assert "shap" in body and "lime" in body


def test_predict_rejects_out_of_range_field(client, teacher_and_student):
    login(client, "t1", "pw12345")
    bad_profile = {**DEFAULT_PROFILE, "financial_stress": 999}
    res = client.post("/api/predict", json=bad_profile)
    assert res.status_code == 422


def test_predict_rejects_student_role(client, teacher_and_student):
    login(client, "s1", "pw12345")
    res = client.post("/api/predict", json=DEFAULT_PROFILE)
    assert res.status_code == 403


def test_counterfactual_already_passing_student_needs_no_changes(client, teacher_and_student):
    login(client, "t1", "pw12345")
    strong_profile = {
        **DEFAULT_PROFILE, "prev_cgpa": 9.5, "internal_marks_pct": 95.0,
        "assignment_completion_pct": 98.0, "attendance_rate": 97.0,
    }
    res = client.post("/api/predict/counterfactual", json=strong_profile)
    assert res.status_code == 200
    body = res.json()
    if body["current_class"] == "Pass":
        assert body["changes_needed"] == []
