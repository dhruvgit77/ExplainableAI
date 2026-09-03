import GlassCard from './GlassCard';

/**
 * Counterfactual recourse plan — the minimum set of changes that flips the
 * prediction to Pass. Shared by Live Prediction, the Teacher modal, and the
 * Student report. Reads a counterfactual object as returned by the backend.
 *
 * Props:
 *   counterfactual — { message, changes_needed[], achieved_pass, final_confidence }
 *   className      — optional extra class for animation hooks
 */
const LABELS = {
  prev_cgpa: 'Previous CGPA',
  internal_marks_pct: 'Internal Marks (%)',
  attendance_rate: 'Attendance (%)',
  assignment_completion_pct: 'Assignment Completion (%)',
  study_hours_per_week: 'Study Hours / Week',
  independent_after_ai: 'Independence After AI (1-5)',
  verify_ai_answers: 'Verifies AI Answers (1-5)',
  ai_reliance: 'AI Reliance (1-5)',
  reduced_thinking_effort: 'Reduced Thinking Effort (1-5)',
  ai_assignment_pct: 'Assignments via AI (%)',
  doomscroll_sleep: 'Doomscrolling (1-4)',
  nonstudy_screen_time: 'Non-study Screen Time (hrs)',
  financial_stress: 'Financial Stress (1-10)',
};

export default function CounterfactualPlan({ counterfactual, className = '' }) {
  if (!counterfactual) return null;
  const changes = counterfactual.changes_needed || [];

  return (
    <GlassCard title="🎯 Counterfactual — What Needs to Change" className={className}>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 16 }}>
        {counterfactual.message}
      </p>

      {changes.length > 0 ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Factor</th><th>Current</th><th>→</th><th>Target</th><th>Change</th></tr>
            </thead>
            <tbody>
              {changes.map((ch, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{LABELS[ch.feature] || ch.feature.replace(/_/g, ' ')}</td>
                  <td>{ch.current_value}</td>
                  <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>→</td>
                  <td style={{ color: '#059669', fontWeight: 700 }}>{ch.target_value}</td>
                  <td style={{ color: ch.change > 0 ? '#059669' : '#DC2626', fontWeight: 600 }}>
                    {ch.change > 0 ? '+' : ''}{ch.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="info-box warning">
          Comprehensive academic support recommended — no single factor change is sufficient.
        </div>
      )}

      {counterfactual.achieved_pass && (
        <div className="info-box success" style={{ marginTop: 12 }}>
          ✅ With these changes, the prediction flips to <strong>Pass</strong>
          {counterfactual.final_confidence != null && <> ({counterfactual.final_confidence}% confidence)</>}.
        </div>
      )}
    </GlassCard>
  );
}
