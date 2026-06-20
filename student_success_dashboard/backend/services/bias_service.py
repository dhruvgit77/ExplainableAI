from sklearn.metrics import accuracy_score
from .model_service import get_model, load_test_data, get_raw_test, PRODUCTION_VARIANT

# Sensitive attributes are all traditional demographic/socioeconomic columns.
ALL_BIAS_ATTRIBUTES = [
    'gender', 'region', 'degree_type', 'parent_education',
    'medium_of_instruction', 'internet_quality', 'coaching_enrolled',
]


def audit_bias(model_name=PRODUCTION_VARIANT):
    X_test, y_test = load_test_data(model_name)
    raw_test = get_raw_test().reset_index(drop=True)

    model = get_model(model_name)
    y_pred = model.predict(X_test)

    df_test = raw_test.copy()
    df_test['predicted_target_encoded'] = y_pred
    df_test['actual_target_encoded'] = y_test.values

    overall_pass_rate = float((df_test['predicted_target_encoded'] == 2).mean())
    actual_pass_mask = df_test['actual_target_encoded'] == 2

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

            if (mask & actual_pass_mask).sum() > 0:
                recall_pass = float(
                    (df_test.loc[mask & actual_pass_mask, 'predicted_target_encoded'] == 2).mean()
                )
            else:
                recall_pass = None

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
