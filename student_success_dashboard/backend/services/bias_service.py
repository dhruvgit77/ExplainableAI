import pandas as pd
import numpy as np
import os
import joblib
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'student_data.csv')
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'models')

ALL_BIAS_ATTRIBUTES = [
    'gender', 'region', 'board_type', 'parent_education',
    'medium_of_instruction', 'internet_quality', 'coaching_enrolled',
]


def audit_bias():
    df = pd.read_csv(DATA_PATH)

    X_test_proc = pd.read_csv(os.path.join(MODEL_DIR, 'X_test_processed.csv'))
    y_test = pd.read_csv(os.path.join(MODEL_DIR, 'y_test.csv')).squeeze('columns')

    target_map = {'Fail': 0, 'At-Risk': 1, 'Pass': 2}
    _, df_test = train_test_split(
        df, test_size=0.2, random_state=42,
        stratify=df['target'].map(target_map),
    )

    models = joblib.load(os.path.join(MODEL_DIR, 'models.joblib'))
    xgb_model = models['XGBoost']

    y_pred = xgb_model.predict(X_test_proc)

    df_test = df_test.copy()
    df_test['predicted_target_encoded'] = y_pred
    df_test['actual_target_encoded'] = y_test.values

    results = []

    for attr in ALL_BIAS_ATTRIBUTES:
        if attr not in df_test.columns:
            continue
        for group in sorted(df_test[attr].unique()):
            mask = df_test[attr] == group
            if mask.sum() == 0:
                continue

            group_acc = accuracy_score(
                df_test.loc[mask, 'actual_target_encoded'],
                df_test.loc[mask, 'predicted_target_encoded'],
            )
            pass_rate = float((df_test.loc[mask, 'predicted_target_encoded'] == 2).mean())

            actual_pass_mask = df_test['actual_target_encoded'] == 2
            if (mask & actual_pass_mask).sum() > 0:
                recall_pass = float(
                    (df_test.loc[mask & actual_pass_mask, 'predicted_target_encoded'] == 2).mean()
                )
            else:
                recall_pass = None

            # Statistical Parity Difference (compared to overall pass rate)
            overall_pass_rate = float((df_test['predicted_target_encoded'] == 2).mean())
            spd = round(pass_rate - overall_pass_rate, 4)

            results.append({
                "attribute": attr,
                "group": group,
                "count": int(mask.sum()),
                "accuracy": round(group_acc, 4),
                "predicted_pass_rate": round(pass_rate, 4),
                "equal_opportunity": round(recall_pass, 4) if recall_pass is not None else None,
                "statistical_parity_diff": spd,
            })

    return results
