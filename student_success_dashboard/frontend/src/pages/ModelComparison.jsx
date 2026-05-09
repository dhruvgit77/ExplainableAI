import { useState, useEffect } from 'react';
import PlotObj from 'react-plotly.js';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';

const PALETTE = ['#8B5CF6', '#A78BFA', '#6D28D9', '#DDD6FE'];
const Plot = PlotObj.default || PlotObj;

export default function ModelComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getModelEvaluation()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Evaluating models..." />;
  if (!data) return <p>Failed to load model evaluation.</p>;

  const { metrics, confusion_matrices } = data;
  const modelNames = Object.keys(metrics);
  const metricNames = Object.keys(metrics[modelNames[0]]);

  // Find best values for highlighting
  const bestValues = {};
  metricNames.forEach((m) => {
    bestValues[m] = Math.max(...modelNames.map((n) => metrics[n][m]));
  });

  // Radar data
  const radarTraces = modelNames.map((name, i) => ({
    type: 'scatterpolar',
    r: metricNames.map((m) => metrics[name][m]),
    theta: metricNames,
    fill: 'toself',
    name,
    line: { color: PALETTE[i] },
    fillcolor: PALETTE[i] + '18',
  }));

  const classLabels = ['Fail', 'At-Risk', 'Pass'];

  return (
    <div>
      <div className="page-header">
        <h1>Model Comparison</h1>
        <p>Evaluate and compare 4 classifiers on the student test set.</p>
      </div>

      {/* Metrics Table */}
      <GlassCard title="Performance Metrics" className="section">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                {metricNames.map((m) => (
                  <th key={m}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modelNames.map((name) => (
                <tr key={name}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{name}</td>
                  {metricNames.map((m) => {
                    const val = metrics[name][m];
                    const isBest = val === bestValues[m];
                    return (
                      <td key={m} className={isBest ? 'highlight' : ''}>
                        {(val * 100).toFixed(1)}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="divider" />

      {/* Radar + Insights */}
      <div className="grid-2-1 section">
        <GlassCard title="Radar Comparison">
          <Plot
            data={radarTraces}
            layout={{
              polar: {
                radialaxis: {
                  visible: true,
                  range: [0.8, 1.0],
                  gridcolor: '#E2E8F0',
                  tickfont: { size: 10 },
                },
                angularaxis: { gridcolor: '#E2E8F0' },
                bgcolor: 'rgba(0,0,0,0)',
              },
              showlegend: true,
              legend: { orientation: 'h', y: -0.15 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 11 },
              margin: { t: 40, b: 60, l: 60, r: 60 },
              height: 400,
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </GlassCard>

        <GlassCard title="Model Insights">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="info-box">
              <strong>XGBoost:</strong> Leading performance in accuracy and F1. Best overall for this dataset.
            </div>
            <div className="info-box warning">
              <strong>SVM:</strong> Robust but computationally heavier for large datasets.
            </div>
            <div className="info-box">
              <strong>Neural Network:</strong> High potential but requires careful hyperparameter tuning.
            </div>
            <div className="info-box warning">
              <strong>Decision Tree:</strong> Most interpretable but prone to variance.
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Confusion Matrices */}
      <h3 className="section-title" style={{ marginTop: 8 }}>Confusion Matrices</h3>
      <div className="grid-2 section">
        {modelNames.map((name) => (
          <GlassCard key={name} title={name}>
            <Plot
              data={[
                {
                  z: confusion_matrices[name],
                  x: classLabels,
                  y: classLabels,
                  type: 'heatmap',
                  colorscale: [
                    [0, '#F5F3FF'],
                    [1, '#8B5CF6'],
                  ],
                  text: confusion_matrices[name].map((row) =>
                    row.map(String)
                  ),
                  texttemplate: '%{text}',
                  showscale: false,
                },
              ]}
              layout={{
                margin: { t: 10, b: 50, l: 60, r: 20 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 12 },
                xaxis: { title: 'Predicted', side: 'bottom' },
                yaxis: { title: 'Actual', autorange: 'reversed' },
                height: 280,
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
