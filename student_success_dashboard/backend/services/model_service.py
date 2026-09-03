import os
from functools import lru_cache

import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, roc_curve,
    classification_report,
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
CLASS_NAMES = ["Fail", "At-Risk", "Pass"]
# The evolved flagship: all three feature tiers (traditional + modern + agentic).
PRODUCTION_VARIANT = "Full"

_artifacts = None


def _ensure_agentic(record: dict, model_name: str) -> dict:
    """For models that need Tier-3 agentic inputs (e.g. 'Full'), fill any missing
    agentic features by running the extraction service. Manual-entry forms only
    provide Tier 1+2; the agentic tier is auto-derived from the student here so the
    rest of the pipeline stays unchanged. Models that don't use agentic columns
    (Traditional/Modern/Combined) are returned untouched."""
    cols = get_input_columns(model_name)
    if all(c in record for c in cols):
        return record
    from .agentic_extraction_service import estimate_from_record
    return {**record, **estimate_from_record(record)}


def _load_artifacts():
    global _artifacts
    if _artifacts is None:
        _artifacts = joblib.load(os.path.join(MODEL_DIR, 'artifacts.joblib'))
    return _artifacts


def _variant(name=PRODUCTION_VARIANT):
    art = _load_artifacts()
    variants = art['variants']
    if name not in variants:
        name = art.get('production_variant', PRODUCTION_VARIANT)
    return variants[name]


# ── Accessors (default to the production "Combined" variant) ─────────────
def get_model(name=PRODUCTION_VARIANT):
    return _variant(name)['model']


def get_preprocessor(name=PRODUCTION_VARIANT):
    return _variant(name)['preprocessor']


def get_feature_names(name=PRODUCTION_VARIANT):
    return _variant(name)['feature_names']


def get_input_columns(name=PRODUCTION_VARIANT):
    v = _variant(name)
    return v['numeric'] + v['categorical']


def get_all_model_names():
    return list(_load_artifacts()['variants'].keys())


def get_raw_test():
    return _load_artifacts()['raw_test']


def load_test_data(name=PRODUCTION_VARIANT):
    """Return (processed X_test DataFrame, y_test Series) for a variant."""
    art = _load_artifacts()
    return _variant(name)['X_test'], art['y_test']


@lru_cache(maxsize=1)
def get_feature_weights():
    """Per-variant normalised feature importances, tagged traditional/modern."""
    art = _load_artifacts()
    # Tier membership comes from each tier's own variant definition.
    trad = _variant('Traditional')
    trad_cols = set(trad['numeric'] + trad['categorical'])
    try:
        agentic = _variant('Agentic')
        agentic_cols = set(agentic['numeric'] + agentic['categorical'])
    except (KeyError, StopIteration):
        agentic_cols = set()

    def _group(raw_feature):
        if raw_feature in trad_cols:
            return 'traditional'
        if raw_feature in agentic_cols:
            return 'agentic'
        return 'modern'

    def _raw_of(feature_name, numeric, categorical):
        # numeric feature names are unchanged; one-hot names look like
        # "region_South" -> map back to the originating categorical column.
        if feature_name in numeric:
            return feature_name
        for c in categorical:
            if feature_name.startswith(c + '_'):
                return c
        return feature_name

    result = {}
    for name, v in art['variants'].items():
        items = []
        for feat, imp in v['feature_importance'].items():
            raw = _raw_of(feat, v['numeric'], v['categorical'])
            items.append({
                "feature": feat,
                "raw_feature": raw,
                "importance": imp,
                "group": _group(raw),
            })
        items.sort(key=lambda x: x['importance'], reverse=True)
        result[name] = {
            "features": items,
            "accuracy": v.get('accuracy'),
            "auc": v.get('auc'),
        }
    return result


# ── Evaluation across the three variants ────────────────────────────────
@lru_cache(maxsize=1)
def evaluate_all_models():
    art = _load_artifacts()
    y_test = art['y_test']

    results = {}
    confusion_matrices = {}
    roc_data = {}
    per_class_metrics = {}

    for name, v in art['variants'].items():
        model = v['model']
        X_test = v['X_test']
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)

        metrics = {
            "Accuracy": round(accuracy_score(y_test, y_pred), 4),
            "Precision (Weighted)": round(precision_score(y_test, y_pred, average='weighted', zero_division=0), 4),
            "Recall (Weighted)": round(recall_score(y_test, y_pred, average='weighted', zero_division=0), 4),
            "F1 Score (Weighted)": round(f1_score(y_test, y_pred, average='weighted', zero_division=0), 4),
            "AUC-ROC (OVR)": round(roc_auc_score(y_test, y_prob, multi_class='ovr'), 4),
        }

        roc_data[name] = {}
        for i in range(3):
            y_test_bin = (y_test == i).astype(int)
            fpr, tpr, _ = roc_curve(y_test_bin, y_prob[:, i])
            roc_data[name][str(i)] = {"fpr": fpr.tolist(), "tpr": tpr.tolist()}

        report = classification_report(
            y_test, y_pred, target_names=CLASS_NAMES,
            output_dict=True, zero_division=0,
        )
        per_class_metrics[name] = {
            cn: {
                "precision": round(report[cn]["precision"], 4),
                "recall": round(report[cn]["recall"], 4),
                "f1-score": round(report[cn]["f1-score"], 4),
                "support": int(report[cn]["support"]),
            }
            for cn in CLASS_NAMES
        }

        results[name] = metrics
        cm = confusion_matrix(y_test, y_pred, labels=[0, 1, 2])
        confusion_matrices[name] = cm.tolist()

    # Multi-model selection summary + cross-validation leaderboard.
    selection = {}
    leaderboard = {}
    for name, v in art['variants'].items():
        selection[name] = {
            "selected_model": v.get("model_name", "XGBoost"),
            "test_accuracy": v.get("accuracy"),
            "train_accuracy": v.get("train_accuracy"),
            "overfit_gap": (round(v["train_accuracy"] - v["accuracy"], 4)
                            if v.get("train_accuracy") is not None else None),
            "cv_mean": v.get("cv_mean"),
            "cv_std": v.get("cv_std"),
            "r2": v.get("r2"),
            "auc": v.get("auc"),
        }
        leaderboard[name] = v.get("leaderboard", [])

    return {
        "metrics": results,
        "confusion_matrices": confusion_matrices,
        "roc_curves": roc_data,
        "per_class_metrics": per_class_metrics,
        "selection": selection,
        "leaderboard": leaderboard,
    }


# ── Prediction (uses the production Combined model by default) ───────────
def predict_student(input_data: dict, model_name: str = PRODUCTION_VARIANT):
    input_data = _ensure_agentic(input_data, model_name)
    preprocessor = get_preprocessor(model_name)
    feature_names = get_feature_names(model_name)
    model = get_model(model_name)
    cols = get_input_columns(model_name)

    df = pd.DataFrame([input_data])[cols]
    processed = preprocessor.transform(df)
    processed_df = pd.DataFrame(processed, columns=feature_names)

    pred_idx = int(model.predict(processed_df)[0])
    pred_probs = model.predict_proba(processed_df)[0].tolist()

    return {
        "predicted_class": CLASS_NAMES[pred_idx],
        "predicted_index": pred_idx,
        "probabilities": {cn: round(p, 4) for cn, p in zip(CLASS_NAMES, pred_probs)},
        "confidence": round(max(pred_probs) * 100, 1),
        "processed_features": processed_df.iloc[0].to_dict(),
    }


def predict_batch(records: list, model_name: str = PRODUCTION_VARIANT):
    """Predict for multiple students at once."""
    records = [_ensure_agentic(r, model_name) for r in records]
    preprocessor = get_preprocessor(model_name)
    feature_names = get_feature_names(model_name)
    model = get_model(model_name)
    cols = get_input_columns(model_name)

    df = pd.DataFrame(records)[cols]
    processed = preprocessor.transform(df)
    processed_df = pd.DataFrame(processed, columns=feature_names)

    preds = model.predict(processed_df)
    probs = model.predict_proba(processed_df)

    results = []
    for i in range(len(records)):
        pred_idx = int(preds[i])
        results.append({
            "index": i,
            "predicted_class": CLASS_NAMES[pred_idx],
            "confidence": round(float(max(probs[i])) * 100, 1),
            "probabilities": {cn: round(float(p), 4) for cn, p in zip(CLASS_NAMES, probs[i])},
        })

    summary = {
        "total": len(results),
        "pass": sum(1 for r in results if r["predicted_class"] == "Pass"),
        "at_risk": sum(1 for r in results if r["predicted_class"] == "At-Risk"),
        "fail": sum(1 for r in results if r["predicted_class"] == "Fail"),
    }

    return {"predictions": results, "summary": summary}


def get_counterfactual(input_data: dict, model_name: str = PRODUCTION_VARIANT):
    """Find minimum changes to flip prediction to Pass.

    Recourse is searched over the actionable Tier-1/Tier-2 levers below. The
    Tier-3 agentic features are RE-DERIVED for every candidate (not held fixed),
    so improving e.g. CGPA / study effort also lifts the measured comprehension &
    engagement scores — making the recommended changes realistic and achievable on
    the Full model rather than artificially capped by stale agentic values.
    """
    from .agentic_extraction_service import estimate_from_record, AGENTIC_FEATURES

    preprocessor = get_preprocessor(model_name)
    feature_names = get_feature_names(model_name)
    model = get_model(model_name)
    cols = get_input_columns(model_name)
    needs_agentic = any(c in cols for c in AGENTIC_FEATURES)

    def _predict(d):
        if needs_agentic:
            base = {k: v for k, v in d.items() if k not in AGENTIC_FEATURES}
            d = {**base, **estimate_from_record(base)}
        frame = pd.DataFrame([d])[cols]
        proc = pd.DataFrame(preprocessor.transform(frame), columns=feature_names)
        return int(model.predict(proc)[0]), model.predict_proba(proc)[0].tolist()

    current_pred, _ = _predict(input_data)

    if current_pred == 2:  # Already Pass
        return {
            "current_class": "Pass",
            "target_class": "Pass",
            "changes_needed": [],
            "message": "Student is already predicted to Pass. No changes needed.",
        }

    # Both traditional and modern levers can move the outcome.
    tweakable = {
        "prev_cgpa": {"min": 1.0, "max": 10.0, "step": 0.5, "direction": "increase"},
        "internal_marks_pct": {"min": 0, "max": 100, "step": 5, "direction": "increase"},
        "attendance_rate": {"min": 40, "max": 100, "step": 5, "direction": "increase"},
        "assignment_completion_pct": {"min": 0, "max": 100, "step": 5, "direction": "increase"},
        "study_hours_per_week": {"min": 0, "max": 40, "step": 2, "direction": "increase"},
        "independent_after_ai": {"min": 1, "max": 5, "step": 1, "direction": "increase"},
        "verify_ai_answers": {"min": 1, "max": 5, "step": 1, "direction": "increase"},
        "ai_reliance": {"min": 1, "max": 5, "step": 1, "direction": "decrease"},
        "reduced_thinking_effort": {"min": 1, "max": 5, "step": 1, "direction": "decrease"},
        "ai_assignment_pct": {"min": 0, "max": 100, "step": 5, "direction": "decrease"},
        "doomscroll_sleep": {"min": 1, "max": 4, "step": 1, "direction": "decrease"},
        "nonstudy_screen_time": {"min": 1, "max": 7, "step": 1, "direction": "decrease"},
        "financial_stress": {"min": 1, "max": 10, "step": 1, "direction": "decrease"},
    }

    # ── Coordinate-ascent search on P(Pass) ─────────────────────────────────
    # At each round, take the single lever step that most increases the Pass
    # probability, commit it, and repeat until the prediction flips to Pass (or
    # no step helps). This accumulates partial progress, so students who need
    # several combined changes get a realistic multi-lever recourse plan instead
    # of "no changes possible".
    PASS = 2
    modified = dict(input_data)
    committed = {}  # feature -> latest value

    def _pass_prob(d):
        return _predict(d)[1][PASS]

    MAX_ROUNDS = 40
    for _ in range(MAX_ROUNDS):
        if _predict(modified)[0] == PASS:
            break
        base_p = _pass_prob(modified)
        best = None  # (gain, feature, new_value)
        for feature, config in tweakable.items():
            if input_data.get(feature) is None:
                continue
            step = config["step"] if config["direction"] == "increase" else -config["step"]
            cur = modified.get(feature, input_data[feature])
            nxt = cur + step
            if not (config["min"] <= nxt <= config["max"]):
                continue
            gain = _pass_prob({**modified, feature: nxt}) - base_p
            if best is None or gain > best[0]:
                best = (gain, feature, nxt)
        if best is None or best[0] <= 1e-4:  # stuck at a local optimum
            break
        _, feature, nxt = best
        modified[feature] = nxt
        committed[feature] = nxt

    changes = [
        {
            "feature": f,
            "current_value": input_data.get(f),
            "target_value": round(v, 2),
            "change": round(v - input_data.get(f), 2),
        }
        for f, v in committed.items()
    ]

    final_pred, final_probs = _predict(modified)

    return {
        "current_class": CLASS_NAMES[current_pred],
        "target_class": CLASS_NAMES[final_pred],
        "achieved_pass": final_pred == 2,
        "changes_needed": changes,
        "final_confidence": round(max(final_probs) * 100, 1),
        "message": (
            f"By making {len(changes)} change(s), the prediction flips to {CLASS_NAMES[final_pred]}."
            if changes else "Unable to find simple changes to reach Pass. Consider comprehensive academic support."
        ),
    }
