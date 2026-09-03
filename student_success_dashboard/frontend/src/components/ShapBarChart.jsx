import PlotObj from 'react-plotly.js';
import GlassCard from './GlassCard';

const Plot = PlotObj.default || PlotObj;

/**
 * Local SHAP explanation as a horizontal bar chart. Green pushed the student
 * towards the predicted class, red pushed away. Shared by Live Prediction, the
 * Teacher modal, and the Student report.
 *
 * Props:
 *   shap           — { features[], shap_values[], feature_values[] }
 *   predictedClass — string used in the subtitle
 *   className      — optional extra class for animation hooks
 */
function cleanLabel(feature, value) {
  let label = feature.replace(/_/g, ' ');
  if (feature.includes('_Yes')) {
    label = label.replace(' Yes', ': ') + (value === 1 ? 'Yes' : 'No');
  } else if (feature.includes('_No')) {
    label = label.replace(' No', ': ') + (value === 1 ? 'No' : 'Yes');
  } else if (label.includes('gender')) {
    label = 'Gender Impact';
  }
  return label;
}

export default function ShapBarChart({ shap, predictedClass, className = '' }) {
  if (!shap || !shap.features) return null;

  const ys = shap.features.slice(0, 10).map((f, i) => cleanLabel(f, shap.feature_values?.[i])).reverse();
  const xs = shap.shap_values.slice(0, 10).reverse();
  const colors = xs.map((v) => (v >= 0 ? '#10B981' : '#EF4444'));

  return (
    <GlassCard title="Why? (SHAP Explanation)" className={className}>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
        Positive values (green) pushed the student <b>towards</b> {predictedClass}.
      </p>
      <Plot
        data={[{ y: ys, x: xs, type: 'bar', orientation: 'h', marker: { color: colors } }]}
        layout={{
          margin: { t: 10, b: 40, l: 180, r: 20 },
          paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
          font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 10 },
          xaxis: { title: 'Impact', gridcolor: '#E2E8F0', zeroline: true, zerolinecolor: '#CBD5E1' },
          yaxis: { automargin: true },
          height: 340,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </GlassCard>
  );
}
