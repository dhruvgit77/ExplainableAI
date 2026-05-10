import shap
import joblib
import pandas as pd
import numpy as np
import os

def load_explainer(model_name="XGBoost"):
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    models = joblib.load(os.path.join(model_dir, 'models.joblib'))
    X_test = pd.read_csv(os.path.join(model_dir, 'X_test_processed.csv'))
    
    model = models[model_name]
    
    # SHAP tree explainer for tree-based models, otherwise Kernel or Permutation
    if model_name in ["XGBoost", "Decision Tree"]:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test)
    else:
        # Use a background dataset for KernelExplainer to be fast
        background = shap.sample(X_test, 100)
        explainer = shap.KernelExplainer(model.predict_proba, background)
        shap_values = explainer.shap_values(X_test.iloc[:100]) # only compute for subset to save time
        
    return explainer, shap_values, X_test

def get_local_explanation(student_data, model_name="XGBoost"):
    """
    student_data is a single row DataFrame (already preprocessed)
    """
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    models = joblib.load(os.path.join(model_dir, 'models.joblib'))
    model = models[model_name]
    
    if model_name in ["XGBoost", "Decision Tree"]:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer(student_data)
    else:
        X_test = pd.read_csv(os.path.join(model_dir, 'X_test_processed.csv'))
        background = shap.sample(X_test, 50)
        explainer = shap.KernelExplainer(model.predict_proba, background)
        shap_values = explainer(student_data)
        
    return explainer, shap_values
