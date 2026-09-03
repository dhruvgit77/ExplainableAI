import { useState, useEffect } from 'react';
import PlotObj from 'react-plotly.js';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useGsapOnData } from '../hooks/useGsap';

const PALETTE = ['#A1A1AA', '#D4D4D8', '#7C3AED', '#52525B', '#0A0A0A'];
const Plot = PlotObj.default || PlotObj;
const CLASS_LABELS = ['Fail', 'At-Risk', 'Pass'];

const VARIANT_BLURB = {
  Traditional: 'Only classic academic signals (CGPA, attendance, marks, study hours, demographics).',
  Modern: 'Only real survey AI-usage behaviour (reliance, verification, independence after AI, assignment outsourcing, digital distraction).',
  Agentic: 'Only Tier-3 features measured from the student\'s actual work (AI-authenticity risk, comprehension depth, reasoning coherence, code originality, cross-modal consistency, learning trajectory).',
  Combined: 'Traditional + Modern self-reported features together.',
  Full: 'All three tiers — Traditional + Modern + Agentic. The production model.',
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

  if (loading) return <LoadingSpinner text="Evaluating Traditional / Modern / Agentic / Combined / Full models..." />;
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
        <h1>Model Comparison — Traditional vs Modern vs Agentic vs Combined vs Full</h1>
        <p>Five ML algorithms (Logistic Regression, Random Forest, Extra Trees, Gradient Boosting, XGBoost) compared with leak-free 5-fold cross-validation across five feature sets. The best model is selected per set. The <b>Agentic</b> tier — features measured from the student's actual work — outpredicts both Traditional and self-reported Modern features alone, and the three-tier <b>Full</b> model is the strongest overall.</p>
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
      {leaderboard?.Full?.length > 0 && (
        <GlassCard title="Algorithm Leaderboard — 5-fold CV Accuracy" className="section gsap-fade">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Algorithm</th>{modelNames.map((n) => <th key={n}>{n}</th>)}</tr>
              </thead>
              <tbody>
                {leaderboard.Full.map((row) => {
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
            <div className="info-box warning"><strong>Modern only:</strong> {VARIANT_BLURB.Modern} Weakest alone — self-report is noisy and gameable.</div>
            <div className="info-box"><strong>Agentic only:</strong> {VARIANT_BLURB.Agentic} Outpredicts both Traditional and Modern on its own — measured-from-work beats self-report.</div>
            <div className="info-box"><strong>Full:</strong> {VARIANT_BLURB.Full} Highest accuracy &amp; AUC — adding the measured agentic tier lifts performance well above the Combined two-tier model.</div>
          </div>
        </GlassCard>
      </div>

      <div className="divider" />

      {/* Feature Weights: traditional vs modern vs agentic in the Full model */}
      {weights?.Full?.features?.length > 0 && (() => {
        const feats = weights.Full.features;
        const top = feats.slice(0, 15);
        const GROUP_COLOR = { traditional: '#A1A1AA', modern: '#52525B', agentic: '#7C3AED' };
        const totals = {
          traditional: feats.filter((f) => f.group === 'traditional').reduce((s, f) => s + f.importance, 0),
          modern: feats.filter((f) => f.group === 'modern').reduce((s, f) => s + f.importance, 0),
          agentic: feats.filter((f) => f.group === 'agentic').reduce((s, f) => s + f.importance, 0),
        };
        const grand = totals.traditional + totals.modern + totals.agentic || 1;
        const pct = (g) => Math.round((totals[g] / grand) * 100);
        return (
          <>
            <h3 className="section-title gsap-fade">Full Model — Feature Weights</h3>
            <p className="gsap-fade" style={{ marginBottom: 16, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              The production model draws on three tiers:{' '}
              <span style={{ color: GROUP_COLOR.traditional, fontWeight: 700 }}>traditional</span>,{' '}
              <span style={{ color: GROUP_COLOR.modern, fontWeight: 700 }}>modern AI-usage</span> and{' '}
              <span style={{ color: GROUP_COLOR.agentic, fontWeight: 700 }}>agentic (measured-from-work)</span> —
              roughly <strong>{pct('traditional')}% / {pct('modern')}% / {pct('agentic')}%</strong> of total importance.
            </p>
            <div className="grid-2-1 section">
              <GlassCard title="Top 15 Features by Importance" className="gsap-fade">
                <Plot
                  data={[{
                    y: top.map((f) => f.feature.replace(/_/g, ' ')).reverse(),
                    x: top.map((f) => f.importance).reverse(),
                    type: 'bar', orientation: 'h',
                    marker: { color: top.map((f) => GROUP_COLOR[f.group] || '#0A0A0A').reverse() },
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
              <GlassCard title="Importance by Tier" className="gsap-fade">
                <Plot
                  data={[{
                    labels: ['Traditional', 'Modern (self-report)', 'Agentic (measured)'],
                    values: [totals.traditional, totals.modern, totals.agentic],
                    type: 'pie', hole: 0.55,
                    marker: { colors: [GROUP_COLOR.traditional, GROUP_COLOR.modern, GROUP_COLOR.agentic] },
                    textinfo: 'label+percent',
                    textfont: { family: 'Plus Jakarta Sans', size: 12 },
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
                  The <strong>agentic tier</strong> — features measured directly from student work — carries substantial
                  weight despite being the newest layer. It captures what self-report misses: genuine comprehension,
                  AI-authenticity, and the cross-modal gap that flags polished-but-hollow submissions.
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
                colorscale: [[0, '#F4F4F5'], [1, '#0A0A0A']],
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
