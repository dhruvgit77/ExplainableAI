"""Load and clean the REAL modern AI-usage features from the student survey.

Source: `Explainable Ai.csv` — 259 real survey responses. We drop the empty
`[Score]`/`[Feedback]` columns and the all-"Other" Q4 columns, then encode the
genuine-signal columns into 11 tidy modern features plus the Q12 "overall impact
of AI on learning" column (used only to anchor the derived target, never as a
model input — that would be target leakage).

These real features REPLACE the previously synthetic modern features so the
Modern and Combined models train on real-world AI-usage behaviour.
"""
import os

import numpy as np
import pandas as pd

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "Explainable Ai.csv")

# Ordinal encodings (handle both hyphen and en-dash variants seen in the export).
LIKERT = {
    "Strongly Disagree": 1, "Disagree": 2, "Neutral": 3,
    "Agree": 4, "Strongly Agree": 5,
}
FREQUENCY_RANK = {  # kept as readable categorical labels after normalisation
    "Never": "Never", "1-3 times/day": "1-3/day",
    "3-5 times/day": "3-5/day", "3–5 times/day": "3-5/day",
    "5+ times/day": "5+/day",
}
ASSIGNMENT_PCT = {
    "0%": 0, "1-25%": 13, "26-50%": 38,
    "51-75%": 63, "76-100%": 88, "76–100%": 88,
}
DIGITAL_FREQ = {"Rarely": 1, "Sometimes": 2, "Often": 3, "Very/Often": 4}
SCREEN_TIME = {
    "Under 2 hrs": 1, "2-4 hrs": 3, "2–4 hrs": 3,
    "4-6 hrs": 5, "4–6 hrs": 5, "6+ hrs": 7,
}
IMPACT = {
    "Significantly worsened learning": -2,
    "Slightly worsened learning": -1,
    "No noticeable change": 0,
    "Slightly improved learning": 1,
    "Significantly improved learning": 2,
}

# The 11 modern features that replace the synthetic ones.
MODERN_NUMERIC = [
    "ai_reliance", "independent_after_ai", "ai_anxiety", "verify_ai_answers",
    "reduced_thinking_effort", "ai_assignment_pct", "multitask_studying",
    "shortform_consumption", "doomscroll_sleep", "nonstudy_screen_time",
]
MODERN_CATEGORICAL = ["ai_usage_frequency"]
MODERN_FEATURES = MODERN_NUMERIC + MODERN_CATEGORICAL


def _find(cols, *needles):
    """Find the single column containing all the given substrings (case-insensitive)."""
    low = [n.lower() for n in needles]
    for c in cols:
        cl = c.lower()
        if all(n in cl for n in low) and "[score]" not in cl and "[feedback]" not in cl:
            return c
    raise KeyError(f"No column matching {needles}")


def load_real_modern():
    """Return a DataFrame of cleaned real modern features + `ai_learning_impact`.

    Rows with missing values in any required column are dropped.
    """
    df = pd.read_csv(CSV_PATH)
    cols = df.columns

    out = pd.DataFrame()
    out["ai_reliance"] = df[_find(cols, "rely heavily on ai")].map(LIKERT)
    out["independent_after_ai"] = df[_find(cols, "solve similar problems independently")].map(LIKERT)
    out["ai_anxiety"] = df[_find(cols, "feel anxious when ai")].map(LIKERT)
    out["verify_ai_answers"] = df[_find(cols, "verify ai-generated answers")].map(LIKERT)
    out["reduced_thinking_effort"] = df[_find(cols, "reduced the effort")].map(LIKERT)
    out["ai_assignment_pct"] = df[_find(cols, "percentage of assignments")].map(ASSIGNMENT_PCT)
    out["multitask_studying"] = df[_find(cols, "multitask on my phone")].map(DIGITAL_FREQ)
    out["shortform_consumption"] = df[_find(cols, "short-form content")].map(DIGITAL_FREQ)
    out["doomscroll_sleep"] = df[_find(cols, "doomscroll")].map(DIGITAL_FREQ)
    out["nonstudy_screen_time"] = df[_find(cols, "non-study screen time")].map(SCREEN_TIME)
    out["ai_usage_frequency"] = df[_find(cols, "ai usage frequency")].map(FREQUENCY_RANK)
    out["ai_learning_impact"] = df[_find(cols, "overall impact of ai")].map(IMPACT)

    out = out.dropna().reset_index(drop=True)
    out[MODERN_NUMERIC] = out[MODERN_NUMERIC].astype(float)
    out["ai_learning_impact"] = out["ai_learning_impact"].astype(int)
    return out


if __name__ == "__main__":
    real = load_real_modern()
    print(f"Loaded {len(real)} clean real responses, {real.shape[1]} columns")
    print(real.describe(include="all").T)
