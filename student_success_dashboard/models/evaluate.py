import os
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, roc_curve

def load_data_and_models():
    model_dir = os.path.dirname(__file__)
    
    # Load processed test data
    X_test = pd.read_csv(os.path.join(model_dir, 'X_test_processed.csv'))
    y_test = pd.read_csv(os.path.join(model_dir, 'y_test.csv')).squeeze('columns')
    
    # Load models
    models = joblib.load(os.path.join(model_dir, 'models.joblib'))
    
    return X_test, y_test, models

def evaluate_models():
    X_test, y_test, models = load_data_and_models()
    
    results = {}
    curves = {}
    cms = {}
    
    for name, model in models.items():
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test) if hasattr(model, 'predict_proba') else None
        
        metrics = {
            'Accuracy': accuracy_score(y_test, y_pred),
            'Precision (Weighted)': precision_score(y_test, y_pred, average='weighted', zero_division=0),
            'Recall (Weighted)': recall_score(y_test, y_pred, average='weighted', zero_division=0),
            'F1 Score (Weighted)': f1_score(y_test, y_pred, average='weighted', zero_division=0),
        }
        
        if y_prob is not None:
            # AUC for multiclass (OVR)
            metrics['AUC-ROC (OVR)'] = roc_auc_score(y_test, y_prob, multi_class='ovr')
            
            # ROC Curves for each class vs rest
            curves[name] = {}
            for i in range(3): # 0: Fail, 1: At-Risk, 2: Pass
                y_test_bin = (y_test == i).astype(int)
                fpr, tpr, _ = roc_curve(y_test_bin, y_prob[:, i])
                curves[name][i] = (fpr, tpr)
                
        results[name] = metrics
        cms[name] = confusion_matrix(y_test, y_pred, labels=[0, 1, 2])
        
    return results, cms, curves

if __name__ == "__main__":
    results, cms, curves = evaluate_models()
    print("Evaluation Results:")
    for m, vals in results.items():
        print(f"\n{m}:")
        for k, v in vals.items():
            print(f"  {k}: {v:.4f}")
