import { useState, useEffect } from 'react';
import PlotObj from 'react-plotly.js';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Plot = PlotObj.default || PlotObj;

export default function Explainability() {
  const [globalShap, setGlobalShap] = useState(null);
  const [localShap, setLocalShap] = useState(null);
  const [localLime, setLocalLime] = useState(null);
  const [studentIndex, setStudentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    api.getShapGlobal()
      .then(setGlobalShap)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadLocalExplanations(studentIndex);
  }, [studentIndex]);

  async function loadLocalExplanations(idx) {
    setLocalLoading(true);
    try {
      const [shap, lime] = await Promise.all([
        api.getShapLocal(idx),
        api.getLimeLocal(idx),
      ]);
      setLocalShap(shap);
      setLocalLime(lime);
    } catch (e) {
      console.error(e);
    } finally {
      setLocalLoading(false);
    }
  }

  if (loading) return <LoadingSpinner text="Computing SHAP values..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Model Explainability</h1>
        <p>Understand how and why the model makes its decisions using SHAP and LIME.</p>
      </div>

      <div className="info-box section">
        Machine Learning models are often "black boxes". <strong>Explainable AI (XAI)</strong> techniques
        like SHAP and LIME help us understand which features drive predictions and by how much.
      </div>

      {/* Global SHAP */}
      <h3 className="section-title">Global Interpretability (SHAP)</h3>
      <p style={{ marginBottom: 16, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        What features drive the model's predictions the most across all students?
      </p>

      {globalShap && (
        <GlassCard className="section">
          <Plot
            data={[
              {
                y: [...globalShap.features].reverse(),
                x: [...globalShap.importance].reverse(),
                type: 'bar',
                orientation: 'h',
                marker: {
                  color: [...globalShap.importance].reverse().map((v, i, arr) => {
                    const ratio = v / Math.max(...arr);
                    return `rgba(139, 92, 246, ${0.3 + ratio * 0.7})`;
                  }),
                },
              },
            ]}
            layout={{
              margin: { t: 10, b: 40, l: 180, r: 30 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 12 },
              xaxis: { title: 'Mean |SHAP Value|', gridcolor: '#E2E8F0' },
              yaxis: { automargin: true },
              height: 420,
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </GlassCard>
      )}

      <div className="divider" />

      {/* Local Section */}
      <h3 className="section-title">Local Interpretability</h3>
      <p style={{ marginBottom: 16, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Analyze an individual student to understand their specific prediction.
      </p>

      <div style={{ marginBottom: 24 }}>
        <div className="slider-group" style={{ maxWidth: 400 }}>
          <div className="slider-header">
            <span className="form-label">Student Index</span>
            <span className="slider-value">{studentIndex}</span>
          </div>
          <input
            type="range"
            min={0}
            max={399}
            value={studentIndex}
            onChange={(e) => setStudentIndex(Number(e.target.value))}
          />
        </div>
      </div>

      {localLoading ? (
        <LoadingSpinner text="Generating explanations..." />
      ) : (
        <div className="grid-2 section">
          {/* Local SHAP Waterfall */}
          {localShap && (
            <GlassCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="glass-card-title" style={{ margin: 0 }}>SHAP Explanation</div>
                <span className={`badge badge-${localShap.predicted_class === 'Pass' ? 'pass' : localShap.predicted_class === 'At-Risk' ? 'risk' : 'fail'}`}>
                  {localShap.predicted_class}
                </span>
              </div>
              <Plot
                data={[
                  {
                    y: localShap.features,
                    x: localShap.shap_values,
                    type: 'bar',
                    orientation: 'h',
                    marker: {
                      color: localShap.shap_values.map((v) =>
                        v >= 0 ? '#8B5CF6' : '#9CA3AF'
                      ),
                    },
                  },
                ]}
                layout={{
                  margin: { t: 10, b: 40, l: 180, r: 20 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 11 },
                  xaxis: { title: 'SHAP Value', gridcolor: '#E2E8F0', zeroline: true, zerolinecolor: '#CBD5E1' },
                  yaxis: { automargin: true },
                  height: 400,
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: '100%' }}
              />
            </GlassCard>
          )}

          {/* Local LIME */}
          {localLime && (
            <GlassCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="glass-card-title" style={{ margin: 0 }}>LIME Explanation</div>
                <span className={`badge badge-${localLime.predicted_class === 'Pass' ? 'pass' : localLime.predicted_class === 'At-Risk' ? 'risk' : 'fail'}`}>
                  {localLime.predicted_class}
                </span>
              </div>
              <Plot
                data={[
                  {
                    y: localLime.contributions.map((c) => c.feature).reverse(),
                    x: localLime.contributions.map((c) => c.weight).reverse(),
                    type: 'bar',
                    orientation: 'h',
                    marker: {
                      color: localLime.contributions
                        .map((c) => (c.weight >= 0 ? '#8B5CF6' : '#9CA3AF'))
                        .reverse(),
                    },
                  },
                ]}
                layout={{
                  margin: { t: 10, b: 40, l: 220, r: 20 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 11 },
                  xaxis: { title: 'LIME Weight', gridcolor: '#E2E8F0', zeroline: true, zerolinecolor: '#CBD5E1' },
                  yaxis: { automargin: true },
                  height: 400,
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: '100%' }}
              />
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
