from backend.routers.auth import DEFAULT_PROFILE
from backend.services import model_service


def test_predict_student_shape_and_class_ordering():
    result = model_service.predict_student(DEFAULT_PROFILE)
    assert result["predicted_class"] == model_service.CLASS_NAMES[result["predicted_index"]]
    assert set(result["probabilities"].keys()) == set(model_service.CLASS_NAMES)
    assert abs(sum(result["probabilities"].values()) - 1.0) < 1e-2
    assert 0 <= result["confidence"] <= 100


def test_predict_batch_summary_counts_match_predictions():
    records = [DEFAULT_PROFILE, {**DEFAULT_PROFILE, "prev_cgpa": 2.0, "attendance_rate": 30.0}]
    result = model_service.predict_batch(records, "Combined")
    assert result["summary"]["total"] == len(records)
    counted = result["summary"]["pass"] + result["summary"]["at_risk"] + result["summary"]["fail"]
    assert counted == len(records)
