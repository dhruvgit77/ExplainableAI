import pandas as pd
import numpy as np
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'student_data.csv')

_df_cache = None


def _load_df():
    global _df_cache
    if _df_cache is None:
        _df_cache = pd.read_csv(DATA_PATH)
    return _df_cache


def get_summary():
    df = _load_df()
    return {
        "total_records": len(df),
        "feature_count": len(df.columns) - 1,
        "class_count": int(df["target"].nunique()),
        "class_distribution": df["target"].value_counts().to_dict(),
    }


def get_preview(n=10):
    df = _load_df()
    return df.head(n).to_dict(orient="records")


def get_target_distribution():
    df = _load_df()
    counts = df["target"].value_counts()
    return {"labels": counts.index.tolist(), "values": counts.values.tolist()}


def get_cgpa_by_target():
    df = _load_df()
    result = []
    for target in df["target"].unique():
        subset = df[df["target"] == target]["prev_cgpa"]
        result.append({
            "target": target,
            "values": subset.tolist(),
        })
    return result


def get_correlation_matrix():
    df = _load_df()
    numeric_df = df.select_dtypes(include=["float64", "int64"])
    corr = numeric_df.corr()
    return {
        "labels": corr.columns.tolist(),
        "matrix": np.round(corr.values, 3).tolist(),
    }


def get_feature_distributions():
    """Distribution of all numeric features split by target outcome."""
    df = _load_df()
    numeric_cols = df.select_dtypes(include=["float64", "int64"]).columns.tolist()
    if "target" in numeric_cols:
        numeric_cols.remove("target")

    result = {}
    for col in numeric_cols:
        result[col] = {}
        for target in sorted(df["target"].unique()):
            values = df[df["target"] == target][col].dropna().tolist()
            result[col][target] = {
                "values": values,
                "mean": round(float(np.mean(values)), 2),
                "median": round(float(np.median(values)), 2),
                "std": round(float(np.std(values)), 2),
            }
    return result


def get_categorical_distributions():
    """Distribution of categorical features split by target outcome."""
    df = _load_df()
    cat_cols = df.select_dtypes(include=["object"]).columns.tolist()
    if "target" in cat_cols:
        cat_cols.remove("target")

    result = {}
    for col in cat_cols:
        cross = pd.crosstab(df[col], df["target"], normalize="index")
        result[col] = {
            "categories": cross.index.tolist(),
            "targets": cross.columns.tolist(),
            "values": np.round(cross.values, 4).tolist(),
        }
    return result
