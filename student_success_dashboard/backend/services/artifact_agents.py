"""The REAL Tier-3 agentic extraction pipeline — powered by OpenAI GPT-4o-mini.

Pipeline
--------
    ingest          file bytes -> OpenAI message content (text / image / PDF-as-text)
    Authenticity    -> ai_authenticity_risk, stylometric_consistency
    Comprehension   -> comprehension_depth, reasoning_coherence,
                       conceptual_error_rate, knowledge_boundary_breadth,
                       dominant_error_type
    Code            -> code_originality            (only when code is present)
    Profile/Synth   -> cross_modal_consistency, authentic_engagement,
                       learning_trajectory_slope

Each agent is a focused GPT-4o-mini call using forced function calling so output
is reliable and schema-checked. PDFs are text-extracted via pypdf; images are
sent as base64 vision content. The orchestrator `run_agent_mesh` returns the
11-key dict IDENTICAL to `agentic_extraction_service.estimate_from_record` so
everything downstream (the Full model, SHAP/LIME, the UI) works unchanged.

Requires OPENAI_API_KEY environment variable.
"""
from __future__ import annotations

import base64
import json
import os
from typing import Optional

MODEL = "gpt-4o-mini"

CODE_EXTS = {
    ".py", ".java", ".c", ".cpp", ".cc", ".h", ".hpp", ".js", ".jsx", ".ts",
    ".tsx", ".go", ".rs", ".rb", ".php", ".cs", ".kt", ".swift", ".m", ".sql",
    ".sh", ".r", ".scala", ".dart",
}
IMAGE_MEDIA = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".gif": "image/gif", ".webp": "image/webp",
}


class ExtractionUnavailable(RuntimeError):
    """Raised when the pipeline cannot run (no API key or missing package)."""


_client_instance = None


def _get_client():
    global _client_instance
    if _client_instance is not None:
        return _client_instance
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ExtractionUnavailable(
            "OPENAI_API_KEY is not set. Export your OpenAI API key to enable "
            "real artifact extraction (the estimation fallback is used otherwise)."
        )
    try:
        from openai import OpenAI
        _client_instance = OpenAI(api_key=api_key)
        return _client_instance
    except ImportError as e:
        raise ExtractionUnavailable(
            "The 'openai' package is not installed. Run: pip install openai"
        ) from e


# ── Ingestion ────────────────────────────────────────────────────────────────
def _ext(filename: str) -> str:
    return os.path.splitext(filename or "")[1].lower()


def _extract_pdf_text(data: bytes) -> str:
    try:
        import io
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n\n".join(pages).strip()
        return text or "[PDF contained no extractable text]"
    except Exception as e:
        return f"[Could not extract PDF text: {e}]"


def artifact_to_block(filename: str, data: bytes) -> dict:
    """Convert one uploaded file into our intermediate content descriptor.

    Images are kept as raw bytes for base64 vision encoding.
    PDFs are text-extracted via pypdf (GPT-4o handles the reasoning).
    Text and code are decoded inline.
    """
    ext = _ext(filename)
    if ext == ".pdf":
        text = _extract_pdf_text(data)
        return {"modality": "document", "filename": filename,
                "mime": None, "data": None,
                "text": f"--- {filename} (PDF, extracted text) ---\n{text}"}
    if ext in IMAGE_MEDIA:
        return {"modality": "image", "filename": filename,
                "mime": IMAGE_MEDIA[ext], "data": data, "text": None}
    text = data.decode("utf-8", errors="replace")
    modality = "code" if ext in CODE_EXTS else "text"
    return {"modality": modality, "filename": filename, "mime": None, "data": None,
            "text": f"--- {filename} ({modality}) ---\n{text}"}


def _blocks_to_content(blocks: list) -> list:
    """Convert our intermediate blocks (or plain strings) into OpenAI message content."""
    content = []
    for b in blocks:
        if isinstance(b, str):
            content.append({"type": "text", "text": b})
        elif b.get("mime"):  # image — send as base64 vision
            b64 = base64.b64encode(b["data"]).decode("utf-8")
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{b['mime']};base64,{b64}"},
            })
        else:  # text, code, or PDF-as-text
            content.append({"type": "text", "text": b["text"]})
    return content


def _call_agent(
    system: str,
    blocks: list,
    fn_name: str,
    fn_description: str,
    fn_params: dict,
    max_tokens: int = 1024,
) -> dict:
    """Run one agent: a single forced-function OpenAI call returning structured JSON."""
    client = _get_client()
    content = _blocks_to_content(blocks)

    tool = {
        "type": "function",
        "function": {
            "name": fn_name,
            "description": fn_description,
            "parameters": fn_params,
        },
    }

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": content},
        ],
        tools=[tool],
        tool_choice={"type": "function", "function": {"name": fn_name}},
        max_tokens=max_tokens,
    )

    message = response.choices[0].message
    if message.tool_calls:
        for tc in message.tool_calls:
            if tc.function.name == fn_name:
                return json.loads(tc.function.arguments)
    raise ExtractionUnavailable("Agent did not return a structured function call response.")


def _clamp(v, lo, hi, default):
    try:
        return max(lo, min(hi, float(v)))
    except (TypeError, ValueError):
        return default


# ── Agents ───────────────────────────────────────────────────────────────────
def authenticity_agent(blocks: list) -> dict:
    out = _call_agent(
        system=(
            "You are an AI-detection forensics agent for an Indian engineering college. "
            "Judge whether submitted academic work was written by the student or generated by AI, "
            "using signals like perplexity, burstiness, generic phrasing, abrupt voice shifts, and "
            "uniformity uncharacteristic of a learning student. Be calibrated, not paranoid."
        ),
        blocks=blocks,
        fn_name="report_authenticity",
        fn_description="Report AI-authorship risk and stylometric consistency for student work.",
        fn_params={
            "type": "object",
            "properties": {
                "ai_authenticity_risk": {
                    "type": "number",
                    "description": "0 to 1 — probability work is AI-generated (0=clearly human, 1=clearly AI).",
                },
                "stylometric_consistency": {
                    "type": "number",
                    "description": "0 to 100 — writing voice consistency (0=patchwork/pasted, 100=consistent student voice).",
                },
                "justification": {"type": "string", "description": "One-sentence reason."},
            },
            "required": ["ai_authenticity_risk", "stylometric_consistency", "justification"],
        },
    )
    return {
        "ai_authenticity_risk": round(_clamp(out.get("ai_authenticity_risk"), 0, 1, 0.5), 3),
        "stylometric_consistency": round(_clamp(out.get("stylometric_consistency"), 0, 100, 60), 1),
    }


def comprehension_agent(blocks: list) -> dict:
    out = _call_agent(
        system=(
            "You are a subject-expert comprehension assessor for an Indian engineering college. "
            "Read the student's work and carefully rate their depth of understanding. "
            "dominant_error_type must be exactly one of: Conceptual, Procedural, Language, Minimal. "
            "Use 'Language' when ideas are sound but English expression hinders the student — "
            "common for regional-medium students."
        ),
        blocks=blocks,
        fn_name="report_comprehension",
        fn_description="Assess depth and quality of student understanding from their submitted work.",
        fn_params={
            "type": "object",
            "properties": {
                "comprehension_depth": {
                    "type": "number",
                    "description": "0 to 100 — genuine understanding vs surface parroting.",
                },
                "reasoning_coherence": {
                    "type": "number",
                    "description": "0 to 100 — quality of claim → evidence → conclusion structure.",
                },
                "conceptual_error_rate": {
                    "type": "number",
                    "description": "0 to 1 — fraction of errors that are conceptual vs careless slips.",
                },
                "knowledge_boundary_breadth": {
                    "type": "number",
                    "description": "0 to 100 — share of course concepts demonstrably mastered.",
                },
                "dominant_error_type": {
                    "type": "string",
                    "enum": ["Conceptual", "Procedural", "Language", "Minimal"],
                    "description": "Error category that best routes intervention.",
                },
            },
            "required": [
                "comprehension_depth", "reasoning_coherence", "conceptual_error_rate",
                "knowledge_boundary_breadth", "dominant_error_type",
            ],
        },
    )
    et = out.get("dominant_error_type")
    if et not in {"Conceptual", "Procedural", "Language", "Minimal"}:
        et = "Procedural"
    return {
        "comprehension_depth": round(_clamp(out.get("comprehension_depth"), 0, 100, 50), 1),
        "reasoning_coherence": round(_clamp(out.get("reasoning_coherence"), 0, 100, 50), 1),
        "conceptual_error_rate": round(_clamp(out.get("conceptual_error_rate"), 0, 1, 0.4), 3),
        "knowledge_boundary_breadth": round(_clamp(out.get("knowledge_boundary_breadth"), 0, 100, 50), 1),
        "dominant_error_type": et,
    }


def code_agent(blocks: list) -> dict:
    out = _call_agent(
        system=(
            "You are a code-forensics agent. Judge whether the submitted source code is the student's "
            "own original work versus copied or AI-generated. Consider idiom consistency, comment style, "
            "variable naming, structural fingerprints, and whether the sophistication matches a learner."
        ),
        blocks=blocks,
        fn_name="report_code",
        fn_description="Assess originality and authorship of the student's source code.",
        fn_params={
            "type": "object",
            "properties": {
                "code_originality": {
                    "type": "number",
                    "description": "0 to 100 — original student work vs copied or AI-generated.",
                },
                "justification": {"type": "string", "description": "One-sentence reason."},
            },
            "required": ["code_originality", "justification"],
        },
    )
    return {"code_originality": round(_clamp(out.get("code_originality"), 0, 100, 60), 1)}


def profile_agent(blocks: list, partial: dict, history: Optional[list]) -> dict:
    """Synthesis agent — sees all prior agents' findings and judges trajectory."""
    context = {"agent_findings": partial, "history_summaries": history or []}
    blocks_with_context = list(blocks) + [
        "Other agents' findings and the student's submission history (JSON):\n"
        + json.dumps(context, indent=2)
    ]
    out = _call_agent(
        system=(
            "You are the profile-synthesis agent. Given a student's work, forensic and comprehension "
            "findings, and any history of past submissions, judge: "
            "(1) cross_modal_consistency — does writing polish match actual depth of understanding? "
            "A large gap signals gaming. "
            "(2) authentic_engagement — genuine self-driven engagement with the material. "
            "(3) learning_trajectory_slope — improving vs declining over time; use 0.0 if no history."
        ),
        blocks=blocks_with_context,
        fn_name="report_profile",
        fn_description="Synthesise cross-modal consistency, authentic engagement, and learning trajectory.",
        fn_params={
            "type": "object",
            "properties": {
                "cross_modal_consistency": {
                    "type": "number",
                    "description": "0 to 100 — polish matches understanding? Low gap signals gaming.",
                },
                "authentic_engagement": {
                    "type": "number",
                    "description": "0 to 100 — composite of genuine self-driven engagement.",
                },
                "learning_trajectory_slope": {
                    "type": "number",
                    "description": "-1 to 1 — improving (positive) vs declining (negative). 0 if no history.",
                },
                "justification": {"type": "string", "description": "One-sentence summary."},
            },
            "required": ["cross_modal_consistency", "authentic_engagement", "learning_trajectory_slope", "justification"],
        },
    )
    return {
        "cross_modal_consistency": round(_clamp(out.get("cross_modal_consistency"), 0, 100, 50), 1),
        "authentic_engagement": round(_clamp(out.get("authentic_engagement"), 0, 100, 50), 1),
        "learning_trajectory_slope": round(_clamp(out.get("learning_trajectory_slope"), -1, 1, 0.0), 3),
    }


# ── Orchestrator ─────────────────────────────────────────────────────────────
def run_agent_mesh(artifacts: list, history: Optional[list] = None) -> dict:
    """Run the full agent mesh over a list of artifacts and return the 11-key Tier-3 dict.

    `artifacts` is a list of {"filename": str, "data": bytes}. `history` is an
    optional list of prior-submission summaries for trajectory analysis.
    """
    if not artifacts:
        raise ExtractionUnavailable("No artifacts supplied for extraction.")

    ingested = [artifact_to_block(a["filename"], a["data"]) for a in artifacts]
    all_blocks = ingested
    code_blocks = [i for i in ingested if i["modality"] == "code"]
    has_code = len(code_blocks) > 0

    features = {}
    features.update(authenticity_agent(all_blocks))
    features.update(comprehension_agent(all_blocks))
    if has_code:
        features.update(code_agent(code_blocks))
    else:
        features["code_originality"] = 75.0
    features.update(profile_agent(all_blocks, dict(features), history))

    # Guarantee the exact 11-key schema (matches estimate_from_record output).
    from .agentic_extraction_service import AGENTIC_NUMERIC, AGENTIC_CATEGORICAL
    ordered = {}
    for k in AGENTIC_NUMERIC:
        ordered[k] = float(features.get(k, 0.0))
    for k in AGENTIC_CATEGORICAL:
        ordered[k] = str(features.get(k, "Procedural"))
    return ordered
