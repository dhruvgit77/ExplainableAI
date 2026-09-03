"""Tier-3 AGENTIC features — measured from a student's actual academic artifacts.

The Traditional tier (Tier 1) is objective institutional data entered by staff.
The Modern tier (Tier 2) is the REAL self-reported AI-usage survey. Both already
exist in the pipeline.

This module adds Tier 3: features that, in production, are extracted automatically
by the agentic pipeline (OCR -> AI-detection -> comprehension -> code-analysis ->
trajectory agents) from a student's exam scripts, reports and code submissions.

There is no real artifact corpus yet, so here we SYNTHESISE Tier-3 features from
two latent traits that also drive the observed Tier-1/Tier-2 signals:

    * `competence`   — genuine understanding (correlates with CGPA, internal marks,
                       working independently after AI, study hours).
    * `ai_dependence`— blind outsourcing to AI (correlates with ai_reliance,
                       ai_assignment_pct, reduced_thinking_effort, low verification).

Deriving the agentic features from these latents (plus measurement noise) gives the
model genuine, learnable structure AND lets Tier 3 contribute NEW interaction signal
that neither earlier tier captures — most importantly the "gaming" pattern:
polished, AI-written submissions sitting on top of weak exam performance.

When the real extraction pipeline is online, `backend/services/agentic_extraction_service.py`
replaces these synthetic values with measured ones — the schema is identical.
"""
import numpy as np
import pandas as pd

# 10 numeric + 1 categorical — mirrors the shape of the Modern tier.
AGENTIC_NUMERIC = [
    "ai_authenticity_risk",      # 0..1   P(submissions are AI-generated)
    "stylometric_consistency",   # 0..100 match to the student's own writing history
    "comprehension_depth",       # 0..100 semantic understanding in answers
    "reasoning_coherence",       # 0..100 claim -> evidence -> conclusion structure
    "code_originality",          # 0..100 original vs copied/AI code (RVCE engineering)
    "cross_modal_consistency",   # 0..100 agreement across written / code / exam
    "learning_trajectory_slope", # -1..1  improving (+) vs declining (-) over the term
    "knowledge_boundary_breadth",# 0..100 share of course concepts demonstrably mastered
    "conceptual_error_rate",     # 0..1   fraction of errors that are conceptual
    "authentic_engagement",      # 0..100 composite genuine-engagement score
]
AGENTIC_CATEGORICAL = ["dominant_error_type"]  # routes the intervention agent
AGENTIC_FEATURES = AGENTIC_NUMERIC + AGENTIC_CATEGORICAL


def _z(x):
    return (x - np.mean(x)) / (np.std(x) + 1e-9)


def _scale01(x):
    """Map an arbitrary score to a 0..1 range via its own min/max."""
    lo, hi = np.min(x), np.max(x)
    return (x - lo) / (hi - lo + 1e-9)


def generate_agentic_features(df: pd.DataFrame, random_seed: int = 42) -> pd.DataFrame:
    """Return a DataFrame of Tier-3 agentic features aligned to the rows of `df`.

    `df` must already contain the Tier-1 traditional and Tier-2 modern columns.
    """
    rng = np.random.default_rng(random_seed)
    n = len(df)

    # ── Latent traits, built from observed signals + their own noise ─────────
    competence = (
        _z(df["prev_cgpa"].to_numpy())
        + 0.8 * _z(df["internal_marks_pct"].to_numpy())
        + 0.5 * _z(df["study_hours_per_week"].to_numpy())
        + 0.6 * _z(df["independent_after_ai"].to_numpy())
        + 0.4 * _z(df["assignment_completion_pct"].to_numpy())
        + rng.normal(0, 0.9, n)
    )
    competence = _z(competence)

    ai_dependence = (
        _z(df["ai_reliance"].to_numpy())
        + 0.9 * _z(df["ai_assignment_pct"].to_numpy())
        + 0.8 * _z(df["reduced_thinking_effort"].to_numpy())
        - 0.7 * _z(df["verify_ai_answers"].to_numpy())
        - 0.6 * _z(df["independent_after_ai"].to_numpy())
        + rng.normal(0, 0.9, n)
    )
    ai_dependence = _z(ai_dependence)

    out = pd.DataFrame(index=df.index)

    # ── Authenticity & style (driven mainly by ai_dependence) ───────────────
    out["ai_authenticity_risk"] = _scale01(
        0.85 * ai_dependence - 0.25 * competence + rng.normal(0, 0.4, n)
    ).round(3)
    out["stylometric_consistency"] = (
        100 * _scale01(-0.7 * ai_dependence + 0.2 * competence + rng.normal(0, 0.5, n))
    ).round(1)

    # ── Understanding (driven mainly by competence, eroded by dependence) ────
    out["comprehension_depth"] = (
        100 * _scale01(0.9 * competence - 0.5 * ai_dependence + rng.normal(0, 0.45, n))
    ).round(1)
    out["reasoning_coherence"] = (
        100 * _scale01(0.8 * competence - 0.4 * ai_dependence + rng.normal(0, 0.5, n))
    ).round(1)
    out["code_originality"] = (
        100 * _scale01(0.5 * competence - 0.8 * ai_dependence + rng.normal(0, 0.5, n))
    ).round(1)

    # ── Cross-modal consistency: low when polished submissions (low authenticity
    #    risk would be high) sit on weak exams. We capture the GAMING gap as
    #    (submission quality) vs (exam reality). High gap -> low consistency. ──
    submission_quality = _z(100 - out["ai_authenticity_risk"].to_numpy() * 100)
    exam_reality = _z(df["internal_marks_pct"].to_numpy())
    gaming_gap = np.abs(submission_quality - exam_reality)
    out["cross_modal_consistency"] = (
        100 * _scale01(-gaming_gap + 0.3 * competence + rng.normal(0, 0.4, n))
    ).round(1)

    # ── Temporal trajectory: improving vs declining over the term ────────────
    out["learning_trajectory_slope"] = np.clip(
        0.5 * competence
        - 0.4 * ai_dependence
        - 0.3 * _z(df["doomscroll_sleep"].to_numpy())
        + rng.normal(0, 0.5, n),
        -3, 3,
    ).round(3) / 3.0  # squash into roughly -1..1

    out["knowledge_boundary_breadth"] = (
        100 * _scale01(0.85 * competence - 0.3 * ai_dependence + rng.normal(0, 0.5, n))
    ).round(1)

    # ── Error profile ────────────────────────────────────────────────────────
    out["conceptual_error_rate"] = _scale01(
        -0.7 * competence + 0.3 * ai_dependence + rng.normal(0, 0.5, n)
    ).round(3)

    # ── Composite authentic-engagement score ────────────────────────────────
    out["authentic_engagement"] = (
        100 * _scale01(
            0.9 * competence
            - 0.9 * ai_dependence
            + 0.3 * _z(out["learning_trajectory_slope"].to_numpy())
            + rng.normal(0, 0.35, n)
        )
    ).round(1)

    # ── Dominant error type (categorical, routes the intervention agent) ──────
    # Language barrier tracks regional medium; conceptual tracks low competence;
    # procedural is the "knows it but slips" middle; minimal for strong students.
    lang_pressure = (df["medium_of_instruction"].to_numpy() == "Regional").astype(float)
    score_conceptual = 0.9 * (1 - _scale01(competence)) + 0.2 * _scale01(ai_dependence)
    score_language = 0.8 * lang_pressure + 0.2 * (1 - _scale01(competence))
    score_procedural = 0.6 * (1 - np.abs(_scale01(competence) - 0.5) * 2)
    score_minimal = 0.9 * _scale01(competence)
    stacked = np.vstack([score_conceptual, score_procedural, score_language, score_minimal]).T
    stacked += rng.normal(0, 0.15, stacked.shape)
    labels = np.array(["Conceptual", "Procedural", "Language", "Minimal"])
    out["dominant_error_type"] = labels[stacked.argmax(axis=1)]

    return out.reset_index(drop=True)


def agentic_subscore(agentic: pd.DataFrame) -> np.ndarray:
    """Tier-3 contribution to the outcome.

    Built ENTIRELY from agentic columns so the relationship is learnable with no
    leakage. Rewards genuine understanding & engagement; penalises AI-authenticity
    risk, cross-modal gaming gaps and declining trajectories.
    """
    a = agentic
    s = np.zeros(len(a))
    s += (a["comprehension_depth"].to_numpy() / 100) * 6
    s += (a["authentic_engagement"].to_numpy() / 100) * 6
    s += (a["reasoning_coherence"].to_numpy() / 100) * 3
    s += (a["knowledge_boundary_breadth"].to_numpy() / 100) * 3
    s += (a["cross_modal_consistency"].to_numpy() / 100) * 4   # anti-gaming reward
    s += a["learning_trajectory_slope"].to_numpy() * 4         # momentum
    s -= a["ai_authenticity_risk"].to_numpy() * 6              # outsourcing penalty
    s -= a["conceptual_error_rate"].to_numpy() * 4
    return s


if __name__ == "__main__":
    import os
    df = pd.read_csv(os.path.join(os.path.dirname(__file__), "student_data.csv"))
    ag = generate_agentic_features(df)
    print(f"Generated {ag.shape[1]} agentic features for {len(ag)} students")
    print(ag.describe(include="all").T)
    print("\nDominant error type:\n", ag["dominant_error_type"].value_counts())
