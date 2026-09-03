import GlassCard from './GlassCard';
import AgenticProfile from './AgenticProfile';
import ShapBarChart from './ShapBarChart';
import CounterfactualPlan from './CounterfactualPlan';

/**
 * The complete rich, interactive view of a prediction result — the prediction
 * badge, Tier-3 cognitive profile, probability breakdown, SHAP explanation and
 * counterfactual recourse plan. Driven entirely by a stored report `result`
 * object, so the Teacher modal and the Student dashboard render identically.
 *
 * Props:
 *   result — the report result: { predicted_class, confidence, probabilities,
 *            agentic_features, shap, counterfactual }
 */
export default function ReportInsights({ result }) {
  if (!result) return null;

  const cls = result.predicted_class;
  const resultClass = cls === 'Pass' ? 'pass' : cls === 'At-Risk' ? 'at-risk' : 'fail';

  return (
    <div className="grid-1-2 section">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className={`result-card ${resultClass}`}>
          <div className="result-label">Predicted Outcome</div>
          <div className="result-value">{cls}</div>
          <div className="result-confidence">Confidence: {result.confidence}%</div>
        </div>

        <AgenticProfile agentic={result.agentic_features} />

        {result.probabilities && (
          <GlassCard title="Probability Breakdown">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(result.probabilities).map(([c, prob]) => (
                <div key={c}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{c}</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{(prob * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ background: 'var(--color-border-light)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${prob * 100}%`, height: '100%', borderRadius: 4,
                      background: c === 'Pass' ? 'var(--color-pass)' : c === 'At-Risk' ? 'var(--color-at-risk)' : 'var(--color-fail)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ShapBarChart shap={result.shap} predictedClass={cls} />
        {result.counterfactual && <CounterfactualPlan counterfactual={result.counterfactual} />}
      </div>
    </div>
  );
}
