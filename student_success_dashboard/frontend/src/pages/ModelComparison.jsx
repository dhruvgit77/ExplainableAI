import { useState, useEffect } from 'react';
import PlotObj from 'react-plotly.js';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useGsapOnData } from '../hooks/useGsap';

const PALETTE = ['#8B5CF6', '#A78BFA', '#6D28D9', '#DDD6FE'];
const Plot = PlotObj.default || PlotObj;
const CLASS_LABELS = ['Fail', 'At-Risk', 'Pass'];

export default function ModelComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useGsapOnData(data, '.gsap-fade');

  useEffect(() => {
    api.getModelEvaluation().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Evaluating models on Indian dataset..." />;
  if (!data) return <p>Failed to load model evaluation.</p>;

  const { metrics, confusion_matrices, roc_curves, per_class_metrics } = data;
  const modelNames = Object.keys(metrics);
  const metricNames = Object.keys(metrics[modelNames[0]]);
  const bestValues = {};
  metricNames.forEach((m) => { bestValues[m] = Math.max(...modelNames.map((n) => metrics[n][m])); });

  const radarTraces = modelNames.map((name, i) => ({
    type: 'scatterpolar', r: metricNames.map((m) => metrics[name][m]),
    theta: metricNames, fill: 'toself', name,
    line: { color: PALETTE[i] }, fillcolor: PALETTE[i] + '18',
  }));

  return (
    <div ref={containerRef}>
      <div className="page-header">
        <h1>Model Comparison</h1>
        <p>Evaluate 4 classifiers trained on Indian student academic data.</p>
      </div>

      {/* Weighted Metrics Table */}
      <GlassCard title="Weighted Performance Metrics" className="section gsap-fade">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Model</th>{metricNames.map((m) => <th key={m}>{m}</th>)}</tr></thead>
            <tbody>
              {modelNames.map((name) => (
                <tr key={name}>
                  <td style={{ fontWeight: 600 }}>{name}</td>
                  {metricNames.map((m) => {
                    const val = metrics[name][m];
                    return <td key={m} className={val === bestValues[m] ? 'highlight' : ''}>{(val * 100).toFixed(1)}%</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Per-Class Metrics */}
      {per_class_metrics && (
        <GlassCard title="Per-Class Breakdown (Precision / Recall / F1)" className="section gsap-fade">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  {CLASS_LABELS.map((c) => (
                    <th key={c} colSpan={3} style={{ textAlign: 'center', borderBottom: '2px solid var(--color-primary-light)' }}>{c}</th>
                  ))}
                </tr>
                <tr>
                  <th></th>
                  {CLASS_LABELS.map((c) => (
                    [<th key={c+'p'} style={{fontSize:'0.7rem'}}>Prec</th>,
                     <th key={c+'r'} style={{fontSize:'0.7rem'}}>Rec</th>,
                     <th key={c+'f'} style={{fontSize:'0.7rem'}}>F1</th>]
                  )).flat()}
                </tr>
              </thead>
              <tbody>
                {modelNames.map((name) => (
                  <tr key={name}>
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    {CLASS_LABELS.map((c) => {
                      const m = per_class_metrics[name]?.[c];
                      if (!m) return [<td key={c+'p'}>-</td>,<td key={c+'r'}>-</td>,<td key={c+'f'}>-</td>];
                      return [
                        <td key={c+'p'}>{(m.precision*100).toFixed(1)}%</td>,
                        <td key={c+'r'}>{(m.recall*100).toFixed(1)}%</td>,
                        <td key={c+'f'}>{(m['f1-score']*100).toFixed(1)}%</td>,
                      ];
                    }).flat()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <div className="divider" />

      {/* Radar + Insights */}
      <div className="grid-2-1 section">
        <GlassCard title="Radar Comparison" className="gsap-fade">
          <Plot data={radarTraces}
            layout={{
              polar: { radialaxis: { visible: true, range: [0.8, 1.0], gridcolor: '#E2E8F0', tickfont: { size: 10 } }, angularaxis: { gridcolor: '#E2E8F0' }, bgcolor: 'rgba(0,0,0,0)' },
              showlegend: true, legend: { orientation: 'h', y: -0.15 },
              paper_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 11 },
              margin: { t: 40, b: 60, l: 60, r: 60 }, height: 400,
            }}
            config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
          />
        </GlassCard>
        <GlassCard title="Model Insights" className="gsap-fade">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="info-box"><strong>XGBoost:</strong> Best overall — handles Indian dataset's mixed features well.</div>
            <div className="info-box warning"><strong>SVM:</strong> Strong but slower. Good for smaller student cohorts.</div>
            <div className="info-box"><strong>Neural Network:</strong> High potential, requires tuning for categorical-heavy Indian data.</div>
            <div className="info-box warning"><strong>Decision Tree:</strong> Most interpretable — ideal for explaining to educators.</div>
          </div>
        </GlassCard>
      </div>

      <div className="divider" />

      {/* ROC Curves */}
      {roc_curves && Object.keys(roc_curves).length > 0 && (
        <>
          <h3 className="section-title">ROC Curves (One-vs-Rest)</h3>
          <div className="grid-3 section">
            {CLASS_LABELS.map((cls, classIdx) => (
              <GlassCard key={cls} title={`Class: ${cls}`} className="gsap-fade">
                <Plot
                  data={modelNames.filter(n => roc_curves[n]).map((name, i) => {
                    const d = roc_curves[name]?.[String(classIdx)];
                    if (!d) return null;
                    return { x: d.fpr, y: d.tpr, type: 'scatter', mode: 'lines', name, line: { color: PALETTE[i], width: 2 } };
                  }).filter(Boolean).concat([{
                    x: [0, 1], y: [0, 1], type: 'scatter', mode: 'lines',
                    name: 'Random', line: { color: '#CBD5E1', dash: 'dot', width: 1 }, showlegend: false,
                  }])}
                  layout={{
                    margin: { t: 10, b: 40, l: 45, r: 10 },
                    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 10 },
                    xaxis: { title: 'FPR', gridcolor: '#E2E8F0', range: [0, 1] },
                    yaxis: { title: 'TPR', gridcolor: '#E2E8F0', range: [0, 1.05] },
                    legend: { orientation: 'h', y: -0.25, font: { size: 9 } }, height: 280,
                  }}
                  config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
                />
              </GlassCard>
            ))}
          </div>
        </>
      )}

      <div className="divider" />

      {/* Confusion Matrices */}
      <h3 className="section-title">Confusion Matrices</h3>
      <div className="grid-2 section">
        {modelNames.map((name) => (
          <GlassCard key={name} title={name} className="gsap-fade">
            <Plot
              data={[{ z: confusion_matrices[name], x: CLASS_LABELS, y: CLASS_LABELS, type: 'heatmap',
                colorscale: [[0, '#F5F3FF'], [1, '#8B5CF6']],
                text: confusion_matrices[name].map((row) => row.map(String)),
                texttemplate: '%{text}', showscale: false }]}
              layout={{
                margin: { t: 10, b: 50, l: 60, r: 20 },
                paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 12 },
                xaxis: { title: 'Predicted', side: 'bottom' },
                yaxis: { title: 'Actual', autorange: 'reversed' }, height: 280,
              }}
              config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
            />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
