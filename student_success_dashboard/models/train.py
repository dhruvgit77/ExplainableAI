import os

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    ExtraTreesClassifier, GradientBoostingClassifier, RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, r2_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

TARGET_MAPPING = {'Fail': 0, 'At-Risk': 1, 'Pass': 2}

# ── Feature groups ──────────────────────────────────────────────────────
TRAD_NUMERIC = [
    'num_subjects', 'study_hours_per_week', 'attendance_rate', 'sleep_hours_avg',
    'extracurricular_count', 'prev_cgpa', 'internal_marks_pct',
    'assignment_completion_pct', 'financial_stress',
]
TRAD_CATEGORICAL = [
    'gender', 'region', 'degree_type', 'parent_education',
    'medium_of_instruction', 'internet_quality', 'coaching_enrolled',
]
# REAL modern AI-usage features (from the student survey).
MODERN_NUMERIC = [
    'ai_reliance', 'independent_after_ai', 'ai_anxiety', 'verify_ai_answers',
    'reduced_thinking_effort', 'ai_assignment_pct', 'multitask_studying',
    'shortform_consumption', 'doomscroll_sleep', 'nonstudy_screen_time',
]
MODERN_CATEGORICAL = ['ai_usage_frequency']

FEATURE_SETS = {
    'Traditional': {'numeric': TRAD_NUMERIC, 'categorical': TRAD_CATEGORICAL},
    'Modern': {'numeric': MODERN_NUMERIC, 'categorical': MODERN_CATEGORICAL},
    'Combined': {
        'numeric': TRAD_NUMERIC + MODERN_NUMERIC,
        'categorical': TRAD_CATEGORICAL + MODERN_CATEGORICAL,
    },
}


def _candidate_models():
    """Model zoo compared for every variant. `tree` flags SHAP-TreeExplainer
    compatibility — only tree models are eligible to become the stored model."""
    return {
        'Logistic Regression': (LogisticRegression(max_iter=2000, C=0.5), False),
        'Random Forest': (RandomForestClassifier(
            n_estimators=400, max_depth=8, min_samples_leaf=8,
            max_features='sqrt', n_jobs=-1, random_state=42), True),
        'Extra Trees': (ExtraTreesClassifier(
            n_estimators=400, max_depth=10, min_samples_leaf=8,
            max_features='sqrt', n_jobs=-1, random_state=42), True),
        'Gradient Boosting': (GradientBoostingClassifier(
            n_estimators=200, max_depth=3, learning_rate=0.05,
            subsample=0.85, min_samples_leaf=20, random_state=42), True),
        'XGBoost': (XGBClassifier(
            n_estimators=300, max_depth=3, learning_rate=0.05,
            subsample=0.85, colsample_bytree=0.85, min_child_weight=5,
            reg_lambda=2.0, reg_alpha=0.5, eval_metric='mlogloss', random_state=42), True),
    }


def _build_preprocessor(numeric, categorical):
    return ColumnTransformer(transformers=[
        ('num', StandardScaler(), numeric),
        ('cat', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'), categorical),
    ])


def _train_variant(name, spec, X_train, X_test, y_train, y_test):
    print(f"\n=== Variant '{name}' "
          f"({len(spec['numeric'])} numeric + {len(spec['categorical'])} categorical) ===", flush=True)

    cols = spec['numeric'] + spec['categorical']
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # ---- Compare every candidate with leak-free 5-fold CV (preprocessing +
    #      SMOTE happen INSIDE each fold via an imblearn pipeline) ----
    leaderboard = []
    for model_name, (estimator, is_tree) in _candidate_models().items():
        pipe = ImbPipeline([
            ('prep', _build_preprocessor(spec['numeric'], spec['categorical'])),
            ('smote', SMOTE(random_state=42)),
            ('clf', estimator),
        ])
        scores = cross_val_score(pipe, X_train[cols], y_train, cv=cv, scoring='accuracy', n_jobs=-1)
        leaderboard.append({
            'model': model_name, 'tree': is_tree,
            'cv_mean': round(float(scores.mean()), 4),
            'cv_std': round(float(scores.std()), 4),
        })
        print(f"  {model_name:20s} CV acc = {scores.mean():.4f} ± {scores.std():.4f}"
              f"{'' if is_tree else '   (non-tree, leaderboard only)'}", flush=True)

    leaderboard.sort(key=lambda r: r['cv_mean'], reverse=True)
    # Best SHAP-compatible (tree) model becomes the production model.
    best = next(r for r in leaderboard if r['tree'])
    winner_name = best['model']
    print(f"  -> selected: {winner_name} (best tree model by CV)", flush=True)

    # ---- Fit winner on the full training set; evaluate on held-out test ----
    preprocessor = _build_preprocessor(spec['numeric'], spec['categorical'])
    X_train_proc = preprocessor.fit_transform(X_train[cols])
    X_test_proc = preprocessor.transform(X_test[cols])
    feature_names = spec['numeric'] + list(
        preprocessor.named_transformers_['cat'].get_feature_names_out(spec['categorical']))

    X_res, y_res = SMOTE(random_state=42).fit_resample(X_train_proc, y_train)
    estimator, _ = _candidate_models()[winner_name]
    model = estimator
    model.fit(X_res, y_res)

    X_test_df = pd.DataFrame(X_test_proc, columns=feature_names).reset_index(drop=True)
    X_train_df = pd.DataFrame(X_train_proc, columns=feature_names)

    y_pred = model.predict(X_test_df)
    y_prob = model.predict_proba(X_test_df)
    train_acc = accuracy_score(y_train, model.predict(X_train_df))
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob, multi_class='ovr')
    r2 = r2_score(y_test, y_pred)

    print(f"  test acc={acc:.4f} | train acc={train_acc:.4f} "
          f"(gap={train_acc - acc:+.4f}) | AUC={auc:.4f} | R²={r2:.4f}", flush=True)

    importances = getattr(model, 'feature_importances_', np.zeros(len(feature_names)))
    total = float(importances.sum()) or 1.0
    feature_importance = {fn: round(float(imp) / total, 4)
                          for fn, imp in zip(feature_names, importances)}

    return {
        'model': model,
        'model_name': winner_name,
        'preprocessor': preprocessor,
        'feature_names': feature_names,
        'numeric': spec['numeric'],
        'categorical': spec['categorical'],
        'X_test': X_test_df,
        'feature_importance': feature_importance,
        'accuracy': round(float(acc), 4),
        'train_accuracy': round(float(train_acc), 4),
        'auc': round(float(auc), 4),
        'r2': round(float(r2), 4),
        'cv_mean': best['cv_mean'],
        'cv_std': best['cv_std'],
        'leaderboard': leaderboard,
    }


def train_models():
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'student_data.csv')
    df = pd.read_csv(data_path)

    X = df.drop(columns=['target'])
    y = df['target'].map(TARGET_MAPPING)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)
    X_test = X_test.reset_index(drop=True)
    y_test = y_test.reset_index(drop=True)

    variants = {name: _train_variant(name, spec, X_train, X_test, y_train, y_test)
                for name, spec in FEATURE_SETS.items()}

    raw_test = X_test.copy()
    raw_test['target'] = y_test.map({v: k for k, v in TARGET_MAPPING.items()}).values

    artifacts = {
        'variants': variants,
        'y_test': y_test,
        'raw_test': raw_test,
        'production_variant': 'Combined',
        'class_names': ['Fail', 'At-Risk', 'Pass'],
    }

    output_dir = os.path.dirname(__file__)
    joblib.dump(artifacts, os.path.join(output_dir, 'artifacts.joblib'))

    combined = variants['Combined']
    combined['X_test'].to_csv(os.path.join(output_dir, 'X_test_processed.csv'), index=False)
    y_test.to_frame(name='target').to_csv(os.path.join(output_dir, 'y_test.csv'), index=False)

    print("\n" + "=" * 70)
    print(f"{'Variant':12s} {'Model':18s} {'Test Acc':>9s} {'Train':>7s} {'CV':>7s} {'AUC':>7s} {'R²':>7s}")
    for name, v in variants.items():
        print(f"{name:12s} {v['model_name']:18s} {v['accuracy']:>9.4f} "
              f"{v['train_accuracy']:>7.4f} {v['cv_mean']:>7.4f} {v['auc']:>7.4f} {v['r2']:>7.4f}")
    print("=" * 70)
    print("Saved artifacts.joblib")


if __name__ == "__main__":
    train_models()
