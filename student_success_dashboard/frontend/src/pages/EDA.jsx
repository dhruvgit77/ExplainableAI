import { useState, useEffect } from 'react';
import PlotObj from 'react-plotly.js';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useGsapOnData } from '../hooks/useGsap';

const PALETTE = ['#8B5CF6', '#A78BFA', '#DDD6FE'];
const Plot = PlotObj.default || PlotObj;

export default function EDA() {
  const [summary, setSummary] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dist, setDist] = useState(null);
  const [boxplot, setBoxplot] = useState(null);
  const [corr, setCorr] = useState(null);
  const [featDist, setFeatDist] = useState(null);
  const [catDist, setCatDist] = useState(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useGsapOnData(!loading, '.gsap-fade');

  useEffect(() => {
    async function load() {
      try {
        const [s, p, d, b, c, fd, cd] = await Promise.all([
          api.getEdaSummary(), api.getEdaPreview(), api.getEdaDistribution(),
          api.getEdaBoxplot(), api.getEdaCorrelation(),
          api.getFeatureDistributions(), api.getCategoricalDistributions(),
        ]);
        setSummary(s); setPreview(p); setDist(d); setBoxplot(b);
        setCorr(c); setFeatDist(fd); setCatDist(cd);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner text="Loading Indian student dataset..." />;

  const numericFeatures = featDist ? Object.keys(featDist) : [];
  const catFeatures = catDist ? Object.keys(catDist) : [];

  return (
    <div ref={containerRef}>
      <div className="page-header">
        <h1>Data Insights</h1>
        <p>Explore patterns and distributions across Indian student academic indicators.</p>
      </div>

      {summary && (
        <div className="grid-3 section">
          <div className="accent-metric gsap-fade">
            <div className="metric-label">Total Students</div>
            <div className="metric-value">{summary.total_records.toLocaleString()}</div>
          </div>
          <div className="accent-metric gsap-fade">
            <div className="metric-label">Features</div>
            <div className="metric-value">{summary.feature_count}</div>
          </div>
          <div className="accent-metric gsap-fade">
            <div className="metric-label">Outcomes</div>
            <div className="metric-value">{summary.class_count}</div>
          </div>
        </div>
      )}

      {preview && preview.length > 0 && (
        <GlassCard title="Dataset Preview" className="section gsap-fade">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr>{Object.keys(preview[0]).map((k) => <th key={k}>{k}</th>)}</tr></thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{typeof v === 'number' ? Number(v.toFixed(2)) : v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <div className="divider" />

      <div className="grid-2 section">
        {dist && (
          <GlassCard title="Outcome Distribution" className="gsap-fade">
            <Plot
              data={[{ labels: dist.labels, values: dist.values, type: 'pie', hole: 0.5, marker: { colors: PALETTE }, textinfo: 'label+percent', textfont: { family: 'Plus Jakarta Sans', size: 13 } }]}
              layout={{ margin: { t: 20, b: 20, l: 20, r: 20 }, paper_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Plus Jakarta Sans', color: '#1E293B' }, showlegend: true, legend: { orientation: 'h', y: -0.1 }, height: 320 }}
              config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
            />
          </GlassCard>
        )}
        {boxplot && (
          <GlassCard title="Previous CGPA by Outcome" className="gsap-fade">
            <Plot
              data={boxplot.map((g, i) => ({ y: g.values, type: 'box', name: g.target, marker: { color: PALETTE[i % PALETTE.length] } }))}
              layout={{ margin: { t: 20, b: 40, l: 50, r: 20 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Plus Jakarta Sans', color: '#1E293B' }, showlegend: false, height: 320, yaxis: { title: 'CGPA (1-10)', gridcolor: '#E2E8F0' } }}
              config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
            />
          </GlassCard>
        )}
      </div>

      {/* Feature Distributions by Outcome */}
      {featDist && numericFeatures.length > 0 && (
        <>
          <div className="divider" />
          <h3 className="section-title">Numeric Feature Distributions by Outcome</h3>
          <div className="grid-2 section">
            {numericFeatures.slice(0, 8).map((feat) => {
              const targets = Object.keys(featDist[feat]);
              return (
                <GlassCard key={feat} title={feat.replace(/_/g, ' ')} className="gsap-fade">
                  <Plot
                    data={targets.map((t, i) => ({
                      y: featDist[feat][t].values.slice(0, 200),
                      type: 'box', name: t,
                      marker: { color: PALETTE[i % PALETTE.length] },
                    }))}
                    layout={{
                      margin: { t: 10, b: 30, l: 50, r: 10 },
                      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                      font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 10 },
                      showlegend: false, height: 220,
                      yaxis: { gridcolor: '#E2E8F0' },
                    }}
                    config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
                  />
                </GlassCard>
              );
            })}
          </div>
        </>
      )}

      {/* Categorical Feature Distributions */}
      {catDist && catFeatures.length > 0 && (
        <>
          <div className="divider" />
          <h3 className="section-title">Categorical Features vs Outcome</h3>
          <div className="grid-2 section">
            {catFeatures.map((feat) => {
              const d = catDist[feat];
              return (
                <GlassCard key={feat} title={feat.replace(/_/g, ' ')} className="gsap-fade">
                  <Plot
                    data={d.targets.map((t, i) => ({
                      x: d.categories,
                      y: d.values.map((row) => row[i]),
                      type: 'bar', name: t,
                      marker: { color: PALETTE[i % PALETTE.length] },
                    }))}
                    layout={{
                      barmode: 'stack',
                      margin: { t: 10, b: 50, l: 45, r: 10 },
                      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                      font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 10 },
                      legend: { orientation: 'h', y: -0.3, font: { size: 9 } },
                      height: 260, xaxis: { tickangle: -30 },
                      yaxis: { title: 'Proportion', gridcolor: '#E2E8F0' },
                    }}
                    config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
                  />
                </GlassCard>
              );
            })}
          </div>
        </>
      )}

      {/* Correlation Matrix */}
      {corr && (
        <>
          <div className="divider" />
          <GlassCard title="Feature Correlation Matrix" className="section gsap-fade">
            <Plot
              data={[{ z: corr.matrix, x: corr.labels, y: corr.labels, type: 'heatmap', colorscale: [[0, '#F5F3FF'], [0.5, '#A78BFA'], [1, '#8B5CF6']], text: corr.matrix.map((row) => row.map((v) => v.toFixed(2))), texttemplate: '%{text}', textfont: { size: 10 }, showscale: true }]}
              layout={{ margin: { t: 20, b: 100, l: 120, r: 20 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 11 }, height: 450, xaxis: { tickangle: -45 } }}
              config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
            />
          </GlassCard>
        </>
      )}
    </div>
  );
}
