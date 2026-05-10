import shap
import numpy as np
import pandas as pd
from .model_service import get_model, load_test_data


def get_global_shap(model_name="XGBoost"):
    """Return mean absolute SHAP values per feature for global interpretation."""
    model = get_model(model_name)
    X_test, _ = load_test_data()

    if model_name in ["XGBoost", "Decision Tree"]:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test)
    else:
        background = shap.sample(X_test, 100)
        explainer = shap.KernelExplainer(model.predict_proba, background)
        shap_values = explainer.shap_values(X_test.iloc[:100])

    # shap_values is list of arrays (one per class) for multiclass
    if isinstance(shap_values, list):
        combined = np.abs(np.array(shap_values)).mean(axis=0).mean(axis=0)
    else:
        combined = np.abs(shap_values).mean(axis=0)
        if combined.ndim > 1:
            combined = combined.mean(axis=1)

    feature_names = X_test.columns.tolist()
    sorted_indices = np.argsort(combined)[::-1]

    return {
        "features": [feature_names[i] for i in sorted_indices],
        "importance": [round(float(combined[i]), 4) for i in sorted_indices],
    }


def get_shap_dependence(model_name="XGBoost", top_n=6):
    """Return feature value vs SHAP value data for dependence plots."""
    model = get_model(model_name)
    X_test, _ = load_test_data()

    if model_name in ["XGBoost", "Decision Tree"]:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test)
    else:
        background = shap.sample(X_test, 100)
        explainer = shap.KernelExplainer(model.predict_proba, background)
        shap_values = explainer.shap_values(X_test.iloc[:100])

    # For multiclass, average SHAP across classes
    if isinstance(shap_values, list):
        avg_shap = np.mean(np.array(shap_values), axis=0)
        combined_importance = np.abs(np.array(shap_values)).mean(axis=0).mean(axis=0)
        data_used = X_test
    else:
        avg_shap = shap_values
        combined_importance = np.abs(shap_values).mean(axis=0)
        if combined_importance.ndim > 1:
            combined_importance = combined_importance.mean(axis=1)
        data_used = X_test if len(shap_values) == len(X_test) else X_test.iloc[:100]

    feature_names = X_test.columns.tolist()
    top_indices = np.argsort(combined_importance)[::-1][:top_n]

    result = []
    for idx in top_indices:
        feat_name = feature_names[idx]
        feat_values = data_used.iloc[:, idx].values
        shap_col = avg_shap[:len(feat_values), idx]

        # Flatten if multi-dimensional (e.g., one SHAP value per class)
        if hasattr(shap_col, 'ndim') and shap_col.ndim > 1:
            shap_col = shap_col.mean(axis=1)

        shap_col = np.asarray(shap_col).flatten()

        # Subsample if too many points
        n = len(feat_values)
        if n > 500:
            sample_idx = np.random.choice(n, 500, replace=False)
            feat_values = feat_values[sample_idx]
            shap_col = shap_col[sample_idx]

        result.append({
            "feature": feat_name,
            "feature_values": [round(float(v), 4) for v in feat_values.tolist()],
            "shap_values": [round(float(v), 4) for v in shap_col.tolist()],
        })

    return result



def get_local_shap(student_index: int, model_name="XGBoost"):
    """Return per-feature SHAP contributions for a single student."""
    model = get_model(model_name)
    X_test, _ = load_test_data()

    student_data = X_test.iloc[[student_index]]

    if model_name in ["XGBoost", "Decision Tree"]:
        explainer = shap.TreeExplainer(model)
        shap_obj = explainer(student_data)
    else:
        background = shap.sample(X_test, 50)
        explainer = shap.KernelExplainer(model.predict_proba, background)
        shap_obj = explainer(student_data)

    pred_idx = int(model.predict(student_data)[0])
    class_names = ["Fail", "At-Risk", "Pass"]

    # Extract values for the predicted class
    if shap_obj.values.ndim == 3:
        values = shap_obj.values[0, :, pred_idx].tolist()
        base_value = float(shap_obj.base_values[0, pred_idx])
    else:
        values = shap_obj.values[0].tolist()
        base_value = float(shap_obj.base_values[0])

    feature_names = X_test.columns.tolist()
    feature_values = student_data.iloc[0].tolist()

    return {
        "predicted_class": class_names[pred_idx],
        "predicted_index": pred_idx,
        "base_value": round(base_value, 4),
        "features": feature_names,
        "shap_values": [round(v, 4) for v in values],
        "feature_values": [round(v, 4) for v in feature_values],
    }


def get_shap_for_input(processed_features: dict, model_name="XGBoost"):
    """SHAP explanation for a live prediction (already-processed features)."""
    model = get_model(model_name)
    X_test, _ = load_test_data()

    student_df = pd.DataFrame([processed_features])

    if model_name in ["XGBoost", "Decision Tree"]:
        explainer = shap.TreeExplainer(model)
        shap_obj = explainer(student_df)
        
        # Get background expected values to show unique contributions
        expected_values = explainer.expected_value
    else:
        background = shap.sample(X_test, 50)
        explainer = shap.KernelExplainer(model.predict_proba, background)
        shap_obj = explainer(student_df)
        expected_values = explainer.expected_value

    pred_idx = int(model.predict(student_df)[0])

    # Extract values for the predicted class
    if shap_obj.values.ndim == 3:
        values = shap_obj.values[0, :, pred_idx]
        base_value = float(expected_values[pred_idx])
    else:
        values = shap_obj.values[0]
        base_value = float(expected_values)

    feature_names = list(processed_features.keys())
    
    # Sort features by absolute SHAP value to show most influential first
    indices = np.argsort(np.abs(values))[::-1]
    
    sorted_features = [feature_names[i] for i in indices]
    sorted_values = [round(float(values[i]), 4) for i in indices]
    sorted_inputs = [round(float(student_df.iloc[0, i]), 4) for i in indices]

    return {
        "base_value": round(base_value, 4),
        "features": sorted_features,
        "shap_values": sorted_values,
        "feature_values": sorted_inputs,
        "predicted_idx": pred_idx
    }
