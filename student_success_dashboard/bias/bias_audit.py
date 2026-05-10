import pandas as pd
import numpy as np
import os
from sklearn.metrics import accuracy_score

def audit_bias():
    # Load original unscaled data for subgroup evaluation
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'student_data.csv')
    df = pd.read_csv(data_path)
    
    # Load processed data and models
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    X_test_proc = pd.read_csv(os.path.join(model_dir, 'X_test_processed.csv'))
    y_test = pd.read_csv(os.path.join(model_dir, 'y_test.csv')).squeeze('columns')
    
    # Get original index test set to match subgroups
    from sklearn.model_selection import train_test_split
    _, df_test = train_test_split(df, test_size=0.2, random_state=42, stratify=df['target'].map({'Fail': 0, 'At-Risk': 1, 'Pass': 2}))
    
    import joblib
    models = joblib.load(os.path.join(model_dir, 'models.joblib'))
    xgb_model = models['XGBoost']
    
    y_pred = xgb_model.predict(X_test_proc)
    
    # Merge predictions with original test dataframe
    df_test = df_test.copy()
    df_test['predicted_target_encoded'] = y_pred
    df_test['actual_target_encoded'] = y_test.values
    
    # Compute metrics across Subgroups (Gender, Region)
    results = []
    
    for attr in ['gender', 'region']:
        for group in df_test[attr].unique():
            mask = df_test[attr] == group
            if mask.sum() == 0:
                continue
                
            group_acc = accuracy_score(df_test.loc[mask, 'actual_target_encoded'], df_test.loc[mask, 'predicted_target_encoded'])
            
            # Demographic parity: percentage of this group predicted as Pass (class 2)
            pass_rate = (df_test.loc[mask, 'predicted_target_encoded'] == 2).mean()
            
            # Positive Class Recall (Equal Opportunity): True Pass / Actual Pass
            actual_pass_mask = (df_test['actual_target_encoded'] == 2)
            if (mask & actual_pass_mask).sum() > 0:
                recall_pass = (df_test.loc[mask & actual_pass_mask, 'predicted_target_encoded'] == 2).mean()
            else:
                recall_pass = np.nan
                
            results.append({
                'Attribute': attr,
                'Group': group,
                'Count': mask.sum(),
                'Accuracy': group_acc,
                'Predicted Pass Rate': pass_rate,
                'Equal Opportunity (Pass Recall)': recall_pass
            })
            
    return pd.DataFrame(results)

if __name__ == "__main__":
    print(audit_bias())
