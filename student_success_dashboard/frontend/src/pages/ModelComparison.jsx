import { useState, useEffect } from 'react';
import PlotObj from 'react-plotly.js';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useGsapOnData } from '../hooks/useGsap';

const PALETTE = ['#4F46E5', '#818CF8', '#3730A3', '#C7D2FE'];
const Plot = PlotObj.default || PlotObj;
const CLASS_LABELS = ['Fail', 'At-Risk', 'Pass'];

const VARIANT_BLURB = {
  Traditional: 'Only classic academic signals (CGPA, attendance, marks, study hours, demographics).',
  Modern: 'Only real survey AI-usage behaviour (reliance, verification, independence after AI, assignment outsourcing, digital distraction).',
  Combined: 'Both feature groups together — the production model.',
};

export default function ModelComparison() {
  const [data, setData] = useState(null);
  const [weights, setWeights] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useGsapOnData(data, '.gsap-fade');

  useEffect(() => {
    Promise.all([api.getModelEvaluation(), api.getFeatureWeights().catch(() => null)])
      .then(([ev, w]) => { setData(ev); setWeights(w); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Evaluating Traditional / Modern / Combined models..." />;
  if (!data) return <p>Failed to load model evaluation.</p>;

  const { metrics, confusion_matrices, roc_curves, per_class_metrics, selection, leaderboard } = data;
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
        <h1>Model Comparison — Traditional vs Modern vs Combined</h1>
        <p>Five ML algorithms (Logistic Regression, Random Forest, Extra Trees, Gradient Boosting, XGBoost) compared with leak-free 5-fold cross-validation across three feature sets. The best model is selected per set; adding the real AI-usage signal is what makes the Combined model win.</p>
      </div>

      {/* Model selection + cross-validation (no-overfit evidence) */}
      {selection && (
        <GlassCard title="Model Selection & Cross-Validation" className="section gsap-fade">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feature Set</th><th>Selected Model</th><th>Test Acc</th>
                  <th>Train Acc</th><th>Overfit Gap</th><th>CV (5-fold)</th><th>R²</th><th>AUC</th>
                </tr>
              </thead>
              <tbody>
                {modelNames.map((name) => {
                  const s = selection[name]; if (!s) return null;
                  return (
                    <tr key={name}>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td><span className="badge badge-pass">{s.selected_model}</span></td>
                      <td>{(s.test_accuracy * 100).toFixed(1)}%</td>
                      <td>{(s.train_accuracy * 100).toFixed(1)}%</td>
                      <td className={s.overfit_gap <= 0.07 ? '' : 'highlight'}
                          style={{ color: s.overfit_gap <= 0.07 ? 'var(--color-pass)' : 'var(--color-at-risk)', fontWeight: 700 }}>
                        {(s.overfit_gap * 100).toFixed(1)}%
                      </td>
                      <td>{(s.cv_mean * 100).toFixed(1)}% ± {(s.cv_std * 100).toFixed(1)}</td>
                      <td style={{ fontWeight: 700 }}>{s.r2?.toFixed(3)}</td>
                      <td>{s.auc?.toFixed(3)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="info-box" style={{ marginTop: 12 }}>
            A small <strong>train→test gap</strong> (and test accuracy ≈ cross-validation accuracy) is the evidence the
            production model is <strong>not overfitting</strong>. R² is the coefficient of determination on the
            encoded outcome (Fail=0, At-Risk=1, Pass=2).
          </div>
        </GlassCard>
      )}

      {/* Per-set algorithm leaderboard (CV accuracy of every candidate) */}
      {leaderboard?.Combined?.length > 0 && (
        <GlassCard title="Algorithm Leaderboard — 5-fold CV Accuracy" className="section gsap-fade">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Algorithm</th>{modelNames.map((n) => <th key={n}>{n}</th>)}</tr>
              </thead>
              <tbody>
                {leaderboard.Combined.map((row) => {
                  const algo = row.model;
                  return (
                    <tr key={algo}>
                      <td style={{ fontWeight: 600 }}>{algo}{row.tree ? '' : ' *'}</td>
                      {modelNames.map((variant) => {
                        const entry = (leaderboard[variant] || []).find((r) => r.model === algo);
                        const best = Math.max(...(leaderboard[variant] || []).map((r) => r.cv_mean));
                        return (
                          <td key={variant} className={entry && entry.cv_mean === best ? 'highlight' : ''}>
                            {entry ? `${(entry.cv_mean * 100).toFixed(1)}%` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 10, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Highlighted = best per feature set. <code>*</code> = non-tree model (compared for reference but not eligible
            as the production model, which must support SHAP TreeExplainer).
          </p>
        </GlassCard>
      )}

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
              polar: { radialaxis: { visible: true, range: [0.4, 1.0], gridcolor: '#E2E8F0', tickfont: { size: 10 } }, angularaxis: { gridcolor: '#E2E8F0' }, bgcolor: 'rgba(0,0,0,0)' },
              showlegend: true, legend: { orientation: 'h', y: -0.15 },
              paper_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 11 },
              margin: { t: 40, b: 60, l: 60, r: 60 }, height: 400,
            }}
            config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
          />
        </GlassCard>
        <GlassCard title="What the comparison shows" className="gsap-fade">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="info-box warning"><strong>Traditional only:</strong> {VARIANT_BLURB.Traditional} Captures real but partial signal.</div>
            <div className="info-box warning"><strong>Modern only:</strong> {VARIANT_BLURB.Modern} Weak alone, but it carries signal traditional features miss.</div>
            <div className="info-box"><strong>Combined:</strong> {VARIANT_BLURB.Combined} Highest accuracy &amp; AUC — adding real AI-usage behaviour to the academic record is what lifts performance from ~68% to ~86%.</div>
          </div>
        </GlassCard>
      </div>

      <div className="divider" />

      {/* Feature Weights: traditional vs modern in the Combined model */}
      {weights?.Combined?.features?.length > 0 && (() => {
        const feats = weights.Combined.features;
        const top = feats.slice(0, 15);
        const TRAD_COLOR = '#0EA5E9';
        const MOD_COLOR = '#4F46E5';
        const tradTotal = feats.filter((f) => f.group === 'traditional').reduce((s, f) => s + f.importance, 0);
        const modTotal = feats.filter((f) => f.group === 'modern').reduce((s, f) => s + f.importance, 0);
        const tradPct = Math.round((tradTotal / (tradTotal + modTotal || 1)) * 100);
        return (
          <>
            <h3 className="section-title gsap-fade">Combined Model — Feature Weights</h3>
            <p className="gsap-fade" style={{ marginBottom: 16, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              The production model draws on <span style={{ color: TRAD_COLOR, fontWeight: 700 }}>traditional</span> and
              {' '}<span style={{ color: MOD_COLOR, fontWeight: 700 }}>modern AI-usage</span> features together —
              roughly <strong>{tradPct}% traditional / {100 - tradPct}% modern</strong> of total importance.
            </p>
            <div className="grid-2-1 section">
              <GlassCard title="Top 15 Features by Importance" className="gsap-fade">
                <Plot
                  data={[{
                    y: top.map((f) => f.feature.replace(/_/g, ' ')).reverse(),
                    x: top.map((f) => f.importance).reverse(),
                    type: 'bar', orientation: 'h',
                    marker: { color: top.map((f) => f.group === 'traditional' ? TRAD_COLOR : MOD_COLOR).reverse() },
                  }]}
                  layout={{
                    margin: { t: 10, b: 40, l: 200, r: 20 },
                    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 11 },
                    xaxis: { title: 'Importance (gain)', gridcolor: '#E2E8F0' },
                    yaxis: { automargin: true }, height: 460,
                  }}
                  config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
                />
              </GlassCard>
              <GlassCard title="Importance by Group" className="gsap-fade">
                <Plot
                  data={[{
                    labels: ['Traditional', 'Modern (AI-era)'],
                    values: [tradTotal, modTotal],
                    type: 'pie', hole: 0.55,
                    marker: { colors: [TRAD_COLOR, MOD_COLOR] },
                    textinfo: 'label+percent',
                    textfont: { family: 'Plus Jakarta Sans', size: 13 },
                  }]}
                  layout={{
                    margin: { t: 10, b: 10, l: 10, r: 10 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    font: { family: 'Plus Jakarta Sans', color: '#1E293B' },
                    height: 300, showlegend: false,
                  }}
                  config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
                />
                <div className="info-box" style={{ marginTop: 12 }}>
                  Traditional features are <strong>not obsolete</strong> — they still carry substantial weight. The real
                  AI-usage features add the missing signal that flips inflated records (heavy reliance, no verification,
                  outsourced assignments) to At-Risk / Fail.
                </div>
              </GlassCard>
            </div>
            <div className="divider" />
          </>
        );
      })()}

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
                colorscale: [[0, '#EEF2FF'], [1, '#4F46E5']],
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
