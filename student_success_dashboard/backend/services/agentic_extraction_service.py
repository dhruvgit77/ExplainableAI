"""Agentic extraction service — the bridge between student artifacts and the
Tier-3 feature vector consumed by the `Full` model.

PRODUCTION ARCHITECTURE (target state)
--------------------------------------
A student's submissions (exam scripts, reports, code) flow through an agent mesh
orchestrated here:

    Ingestion Agent      OCR / PDF / AST parsing -> raw text + code
    AI-Detection Agent   perplexity, burstiness, stylometry vs own history
                         -> ai_authenticity_risk, stylometric_consistency
    Comprehension Agent  semantic coherence, error classification
                         -> comprehension_depth, reasoning_coherence,
                            conceptual_error_rate, dominant_error_type
    Code-Analysis Agent  AST originality, quality      -> code_originality
    Trajectory Agent     longitudinal drift            -> learning_trajectory_slope
    Profile Agent        cross-format agreement, breadth, composite
                         -> cross_modal_consistency, knowledge_boundary_breadth,
                            authentic_engagement

Each agent calls the fine-tuned LLM (claude-sonnet-4-6 for generation, a LoRA-tuned
scorer for comprehension/authenticity), and an Explanation-Validator agent grounds
every LLM claim against the model's SHAP values before it reaches a user.

CURRENT STATE (no real artifact corpus yet)
-------------------------------------------
Until artifact ingestion is wired up, `estimate_from_record` derives Tier-3
features from the Tier-1/Tier-2 record using the SAME latent-trait logic the
training data was generated with. This lets the `Full` model run end-to-end for a
manually-entered student. Swap `estimate_from_record` for `extract_from_artifacts`
when the agents are online — the output schema is identical, so nothing downstream
changes.
"""
from __future__ import annotations

import sys
from functools import lru_cache
from pathlib import Path

import pandas as pd

# Reuse the single source of truth for the Tier-3 schema + derivation.
DATA_DIR = Path(__file__).resolve().parents[2] / "data"
if str(DATA_DIR) not in sys.path:
    sys.path.insert(0, str(DATA_DIR))

from agentic_features import (  # noqa: E402
    AGENTIC_NUMERIC, AGENTIC_CATEGORICAL, generate_agentic_features,
)

AGENTIC_FEATURES = AGENTIC_NUMERIC + AGENTIC_CATEGORICAL
_COHORT_PATH = DATA_DIR / "student_data.csv"


@lru_cache(maxsize=1)
def _cohort() -> pd.DataFrame:
    """The reference cohort. Agentic features are population-relative, so a single
    student is scored against this distribution (drop the agentic/target cols so we
    re-derive Tier 3 fresh)."""
    df = pd.read_csv(_COHORT_PATH)
    return df.drop(columns=[c for c in AGENTIC_FEATURES + ["target"] if c in df.columns])


def estimate_from_record(record: dict, random_seed: int = 42) -> dict:
    """Estimate Tier-3 agentic features for a single Tier-1/Tier-2 student record.

    The student is appended to the reference cohort so the cohort-relative scoring
    (z-scores, min/max) is well defined, then their row is returned. Deterministic
    for a given record+seed. Output is the 11 agentic features ready to merge into
    the record before calling the `Full` model.
    """
    cohort = _cohort()
    row = pd.DataFrame([record]).reindex(columns=cohort.columns)
    batch = pd.concat([cohort, row], ignore_index=True)
    agentic = generate_agentic_features(batch, random_seed=random_seed)
    last = agentic.iloc[-1].to_dict()
    # numpy -> native python for JSON serialisability
    return {
        k: (float(last[k]) if k in AGENTIC_NUMERIC else str(last[k]))
        for k in AGENTIC_FEATURES
    }


def enrich_record(record: dict, random_seed: int = 42) -> dict:
    """Return a copy of `record` with the agentic features added in place."""
    enriched = dict(record)
    enriched.update(estimate_from_record(record, random_seed=random_seed))
    return enriched


def extract_from_artifacts(student_id: str, artifacts: list, history: list | None = None) -> dict:
    """Run the REAL agent mesh over a student's submissions.

    `artifacts` is a list of {"filename": str, "data": bytes} (PDFs, scanned
    scripts, reports, code). Orchestrates the ingestion/authenticity/comprehension/
    code/profile agents (see `artifact_agents`) and returns the same 11-key dict as
    `estimate_from_record`, so everything downstream is unchanged.

    Requires ANTHROPIC_API_KEY. Raises `artifact_agents.ExtractionUnavailable`
    if the pipeline can't run (no key / SDK), so callers can fall back gracefully.
    """
    from .artifact_agents import run_agent_mesh
    return run_agent_mesh(artifacts, history=history)


if __name__ == "__main__":
    sample = {
        "prev_cgpa": 8.4, "internal_marks_pct": 78, "study_hours_per_week": 22,
        "assignment_completion_pct": 85, "independent_after_ai": 4,
        "ai_reliance": 2, "ai_assignment_pct": 25, "reduced_thinking_effort": 2,
        "verify_ai_answers": 4, "doomscroll_sleep": 2, "medium_of_instruction": "English",
    }
    from pprint import pprint
    pprint(estimate_from_record(sample))
