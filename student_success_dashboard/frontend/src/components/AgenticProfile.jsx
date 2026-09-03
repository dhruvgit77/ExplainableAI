import GlassCard from './GlassCard';

/**
 * Tier-3 "Agentic" cognitive profile — the features measured from the student's
 * own work. Shared by Live Prediction, the Teacher report modal, and the
 * Student report so the three-tier story renders identically everywhere.
 *
 * Props:
 *   agentic   — the agentic_features object from the API (10 numeric + dominant_error_type)
 *   className — optional extra class for animation hooks
 */
const FIELDS = [
  { k: 'ai_authenticity_risk', label: 'AI-Authenticity Risk', kind: 'risk01' },
  { k: 'authentic_engagement', label: 'Authentic Engagement', kind: 'score100' },
  { k: 'comprehension_depth', label: 'Comprehension Depth', kind: 'score100' },
  { k: 'reasoning_coherence', label: 'Reasoning Coherence', kind: 'score100' },
  { k: 'code_originality', label: 'Code Originality', kind: 'score100' },
  { k: 'cross_modal_consistency', label: 'Cross-Modal Consistency', kind: 'score100' },
  { k: 'stylometric_consistency', label: 'Stylometric Consistency', kind: 'score100' },
  { k: 'knowledge_boundary_breadth', label: 'Knowledge Breadth', kind: 'score100' },
  { k: 'conceptual_error_rate', label: 'Conceptual Error Rate', kind: 'risk01' },
  { k: 'learning_trajectory_slope', label: 'Learning Trajectory', kind: 'slope' },
];

function display(value, kind) {
  if (kind === 'score100') {
    return {
      text: `${Math.round(value)}/100`,
      color: value >= 67 ? '#059669' : value >= 40 ? '#D97706' : '#DC2626',
    };
  }
  if (kind === 'risk01') {
    return {
      text: `${Math.round(value * 100)}%`,
      color: value <= 0.33 ? '#059669' : value <= 0.66 ? '#D97706' : '#DC2626',
    };
  }
  // slope
  return {
    text: value > 0.05 ? '↗ Improving' : value < -0.05 ? '↘ Declining' : '→ Flat',
    color: value > 0.05 ? '#059669' : value < -0.05 ? '#DC2626' : '#D97706',
  };
}

export default function AgenticProfile({ agentic, className = '' }) {
  if (!agentic) return null;

  return (
    <GlassCard title="🔬 Auto-Extracted Cognitive Profile (Tier 3)" className={className}>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
        Measured from the student's submitted work — no manual entry. These feed the Full model
        alongside the academic record and AI-usage profile.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {FIELDS.map(({ k, label, kind }) => {
          const v = agentic[k];
          if (v == null) return null;
          const { text, color } = display(v, kind);
          return (
            <div
              key={k}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: '1px solid var(--color-border-light)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{label}</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color }}>{text}</span>
            </div>
          );
        })}
      </div>
      {agentic.dominant_error_type && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--color-border-light)', borderRadius: 6, fontSize: '0.8125rem' }}>
          Dominant error type: <b>{agentic.dominant_error_type}</b>
        </div>
      )}
    </GlassCard>
  );
}
