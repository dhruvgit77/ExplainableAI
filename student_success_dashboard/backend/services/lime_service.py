import numpy as np
import pandas as pd
from lime.lime_tabular import LimeTabularExplainer
from .model_service import get_model, load_test_data, get_feature_names


def _build_explainer(model_name="XGBoost"):
    """Build a LIME tabular explainer using the test data as background."""
    X_test, y_test = load_test_data()
    feature_names = get_feature_names()
    class_names = ["Fail", "At-Risk", "Pass"]

    explainer = LimeTabularExplainer(
        training_data=X_test.values,
        feature_names=feature_names,
        class_names=class_names,
        mode="classification",
        discretize_continuous=True,
    )
    return explainer, X_test


def get_local_lime(student_index: int, model_name="XGBoost"):
    """LIME explanation for a student from the test set."""
    explainer, X_test = _build_explainer(model_name)
    model = get_model(model_name)

    instance = X_test.iloc[student_index].values
    pred_idx = int(model.predict(instance.reshape(1, -1))[0])
    class_names = ["Fail", "At-Risk", "Pass"]

    explanation = explainer.explain_instance(
        data_row=instance,
        predict_fn=model.predict_proba,
        num_features=len(X_test.columns),
        labels=[pred_idx],
    )

    contrib = explanation.as_list(label=pred_idx)

    return {
        "predicted_class": class_names[pred_idx],
        "predicted_index": pred_idx,
        "contributions": [
            {"feature": feat, "weight": round(float(weight), 4)}
            for feat, weight in contrib
        ],
    }


def get_lime_for_input(processed_features: dict, model_name="XGBoost"):
    """LIME explanation for a live prediction (already-processed features)."""
    explainer, X_test = _build_explainer(model_name)
    model = get_model(model_name)

    instance = np.array(list(processed_features.values()))
    pred_idx = int(model.predict(instance.reshape(1, -1))[0])
    class_names = ["Fail", "At-Risk", "Pass"]

    # Higher num_samples makes it less "vague" and more stable
    explanation = explainer.explain_instance(
        data_row=instance,
        predict_fn=model.predict_proba,
        num_features=len(processed_features),
        labels=[pred_idx],
        num_samples=5000
    )

    contrib = explanation.as_list(label=pred_idx)
    
    # Sort by absolute weight to ensure top drivers are first
    sorted_contrib = sorted(contrib, key=lambda x: abs(x[1]), reverse=True)

    return {
        "predicted_class": class_names[pred_idx],
        "contributions": [
            {"feature": feat, "weight": round(float(weight), 4)}
            for feat, weight in sorted_contrib
        ],
    }
