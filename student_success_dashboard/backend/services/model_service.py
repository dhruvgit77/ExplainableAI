import os
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, roc_curve,
    classification_report,
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'models')

_models = None
_preprocessor = None
_feature_names = None


def _load_models():
    global _models
    if _models is None:
        _models = joblib.load(os.path.join(MODEL_DIR, 'models.joblib'))
    return _models


def _load_preprocessor():
    global _preprocessor
    if _preprocessor is None:
        _preprocessor = joblib.load(os.path.join(MODEL_DIR, 'preprocessor.joblib'))
    return _preprocessor


def _load_feature_names():
    global _feature_names
    if _feature_names is None:
        _feature_names = joblib.load(os.path.join(MODEL_DIR, 'feature_names.joblib'))
    return _feature_names


def get_model(name="XGBoost"):
    return _load_models()[name]


def get_preprocessor():
    return _load_preprocessor()


def get_feature_names():
    return _load_feature_names()


def get_all_model_names():
    return list(_load_models().keys())


def load_test_data():
    X_test = pd.read_csv(os.path.join(MODEL_DIR, 'X_test_processed.csv'))
    y_test = pd.read_csv(os.path.join(MODEL_DIR, 'y_test.csv')).squeeze('columns')
    return X_test, y_test


def evaluate_all_models():
    X_test, y_test = load_test_data()
    models = _load_models()
    class_names = ["Fail", "At-Risk", "Pass"]

    results = {}
    confusion_matrices = {}
    roc_data = {}
    per_class_metrics = {}

    for name, model in models.items():
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test) if hasattr(model, 'predict_proba') else None

        metrics = {
            "Accuracy": round(accuracy_score(y_test, y_pred), 4),
            "Precision (Weighted)": round(precision_score(y_test, y_pred, average='weighted', zero_division=0), 4),
            "Recall (Weighted)": round(recall_score(y_test, y_pred, average='weighted', zero_division=0), 4),
            "F1 Score (Weighted)": round(f1_score(y_test, y_pred, average='weighted', zero_division=0), 4),
        }

        if y_prob is not None:
            metrics["AUC-ROC (OVR)"] = round(
                roc_auc_score(y_test, y_prob, multi_class='ovr'), 4
            )
            roc_data[name] = {}
            for i in range(3):
                y_test_bin = (y_test == i).astype(int)
                fpr, tpr, _ = roc_curve(y_test_bin, y_prob[:, i])
                roc_data[name][str(i)] = {
                    "fpr": fpr.tolist(),
                    "tpr": tpr.tolist(),
                }

        # Per-class metrics
        report = classification_report(
            y_test, y_pred, target_names=class_names,
            output_dict=True, zero_division=0,
        )
        per_class_metrics[name] = {
            cn: {
                "precision": round(report[cn]["precision"], 4),
                "recall": round(report[cn]["recall"], 4),
                "f1-score": round(report[cn]["f1-score"], 4),
                "support": int(report[cn]["support"]),
            }
            for cn in class_names
        }

        results[name] = metrics
        cm = confusion_matrix(y_test, y_pred, labels=[0, 1, 2])
        confusion_matrices[name] = cm.tolist()

    return {
        "metrics": results,
        "confusion_matrices": confusion_matrices,
        "roc_curves": roc_data,
        "per_class_metrics": per_class_metrics,
    }


def predict_student(input_data: dict, model_name: str = "XGBoost"):
    preprocessor = _load_preprocessor()
    feature_names = _load_feature_names()
    model = get_model(model_name)

    df = pd.DataFrame([input_data])
    processed = preprocessor.transform(df)
    processed_df = pd.DataFrame(processed, columns=feature_names)

    pred_idx = int(model.predict(processed_df)[0])
    pred_probs = model.predict_proba(processed_df)[0].tolist()
    class_names = ["Fail", "At-Risk", "Pass"]

    return {
        "predicted_class": class_names[pred_idx],
        "predicted_index": pred_idx,
        "probabilities": {cn: round(p, 4) for cn, p in zip(class_names, pred_probs)},
        "confidence": round(max(pred_probs) * 100, 1),
        "processed_features": processed_df.iloc[0].to_dict(),
    }


def predict_batch(records: list, model_name: str = "XGBoost"):
    """Predict for multiple students at once."""
    preprocessor = _load_preprocessor()
    feature_names = _load_feature_names()
    model = get_model(model_name)
    class_names = ["Fail", "At-Risk", "Pass"]

    df = pd.DataFrame(records)
    processed = preprocessor.transform(df)
    processed_df = pd.DataFrame(processed, columns=feature_names)

    preds = model.predict(processed_df)
    probs = model.predict_proba(processed_df)

    results = []
    for i in range(len(records)):
        pred_idx = int(preds[i])
        results.append({
            "index": i,
            "predicted_class": class_names[pred_idx],
            "confidence": round(float(max(probs[i])) * 100, 1),
            "probabilities": {cn: round(float(p), 4) for cn, p in zip(class_names, probs[i])},
        })

    summary = {
        "total": len(results),
        "pass": sum(1 for r in results if r["predicted_class"] == "Pass"),
        "at_risk": sum(1 for r in results if r["predicted_class"] == "At-Risk"),
        "fail": sum(1 for r in results if r["predicted_class"] == "Fail"),
    }

    return {"predictions": results, "summary": summary}


def get_counterfactual(input_data: dict, model_name: str = "XGBoost"):
    """Find minimum changes to flip prediction to Pass."""
    preprocessor = _load_preprocessor()
    feature_names = _load_feature_names()
    model = get_model(model_name)
    class_names = ["Fail", "At-Risk", "Pass"]

    # Current prediction
    df = pd.DataFrame([input_data])
    processed = preprocessor.transform(df)
    processed_df = pd.DataFrame(processed, columns=feature_names)
    current_pred = int(model.predict(processed_df)[0])

    if current_pred == 2:  # Already Pass
        return {
            "current_class": "Pass",
            "target_class": "Pass",
            "changes_needed": [],
            "message": "Student is already predicted to Pass. No changes needed.",
        }

    # Try tweaking numeric features to reach Pass
    tweakable = {
        "prev_cgpa": {"min": 1.0, "max": 10.0, "step": 0.5, "direction": "increase"},
        "internal_marks_pct": {"min": 0, "max": 100, "step": 5, "direction": "increase"},
        "attendance_rate": {"min": 40, "max": 100, "step": 5, "direction": "increase"},
        "assignment_completion_pct": {"min": 0, "max": 100, "step": 5, "direction": "increase"},
        "study_hours_per_week": {"min": 0, "max": 40, "step": 2, "direction": "increase"},
        "sleep_hours_avg": {"min": 3, "max": 12, "step": 0.5, "direction": "increase"},
        "financial_stress": {"min": 1, "max": 10, "step": 1, "direction": "decrease"},
        "extracurricular_count": {"min": 0, "max": 5, "step": 1, "direction": "increase"},
    }

    changes = []
    modified = dict(input_data)

    for feature, config in tweakable.items():
        original_val = input_data.get(feature)
        if original_val is None:
            continue

        best_val = original_val
        step = config["step"] if config["direction"] == "increase" else -config["step"]

        val = original_val
        while config["min"] <= val + step <= config["max"]:
            val += step
            test_data = dict(modified)
            test_data[feature] = val
            test_df = pd.DataFrame([test_data])
            test_processed = preprocessor.transform(test_df)
            test_processed_df = pd.DataFrame(test_processed, columns=feature_names)
            pred = int(model.predict(test_processed_df)[0])

            if pred == 2:  # Pass
                changes.append({
                    "feature": feature,
                    "current_value": original_val,
                    "target_value": val,
                    "change": round(val - original_val, 2),
                })
                modified[feature] = val
                break

    # Verify combined changes lead to Pass
    test_df = pd.DataFrame([modified])
    test_processed = preprocessor.transform(test_df)
    test_processed_df = pd.DataFrame(test_processed, columns=feature_names)
    final_pred = int(model.predict(test_processed_df)[0])
    final_probs = model.predict_proba(test_processed_df)[0].tolist()

    return {
        "current_class": class_names[current_pred],
        "target_class": class_names[final_pred],
        "achieved_pass": final_pred == 2,
        "changes_needed": changes,
        "final_confidence": round(max(final_probs) * 100, 1),
        "message": (
            f"By making {len(changes)} change(s), the prediction flips to {class_names[final_pred]}."
            if changes else "Unable to find simple changes to reach Pass. Consider comprehensive academic support."
        ),
    }
