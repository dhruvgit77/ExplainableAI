import { useState, useEffect } from 'react';
import PlotObj from 'react-plotly.js';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';

const PALETTE = ['#8B5CF6', '#A78BFA', '#DDD6FE'];
const Plot = PlotObj.default || PlotObj;

export default function EDA() {
  const [summary, setSummary] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dist, setDist] = useState(null);
  const [boxplot, setBoxplot] = useState(null);
  const [corr, setCorr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, p, d, b, c] = await Promise.all([
          api.getEdaSummary(),
          api.getEdaPreview(),
          api.getEdaDistribution(),
          api.getEdaBoxplot(),
          api.getEdaCorrelation(),
        ]);
        setSummary(s);
        setPreview(p);
        setDist(d);
        setBoxplot(b);
        setCorr(c);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dataset..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Data Insights</h1>
        <p>Explore patterns and distributions in the student dataset.</p>
      </div>

      {/* Summary Metrics */}
      {summary && (
        <div className="grid-3 section">
          <div className="accent-metric animate-in">
            <div className="metric-label">Total Records</div>
            <div className="metric-value">{summary.total_records.toLocaleString()}</div>
          </div>
          <div className="accent-metric animate-in">
            <div className="metric-label">Features Analyzed</div>
            <div className="metric-value">{summary.feature_count}</div>
          </div>
          <div className="accent-metric animate-in">
            <div className="metric-label">Success Categories</div>
            <div className="metric-value">{summary.class_count}</div>
          </div>
        </div>
      )}

      {/* Data Preview */}
      {preview && preview.length > 0 && (
        <GlassCard title="Dataset Preview" className="section">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {Object.keys(preview[0]).map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j}>{typeof v === 'number' ? Number(v.toFixed(2)) : v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <div className="divider" />

      {/* Charts Row */}
      <div className="grid-2 section">
        {dist && (
          <GlassCard title="Outcome Distribution">
            <Plot
              data={[
                {
                  labels: dist.labels,
                  values: dist.values,
                  type: 'pie',
                  hole: 0.5,
                  marker: { colors: PALETTE },
                  textinfo: 'label+percent',
                  textfont: { family: 'Plus Jakarta Sans', size: 13 },
                },
              ]}
              layout={{
                margin: { t: 20, b: 20, l: 20, r: 20 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Plus Jakarta Sans', color: '#1E293B' },
                showlegend: true,
                legend: { orientation: 'h', y: -0.1 },
                height: 320,
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          </GlassCard>
        )}

        {boxplot && (
          <GlassCard title="Previous GPA by Outcome">
            <Plot
              data={boxplot.map((g, i) => ({
                y: g.values,
                type: 'box',
                name: g.target,
                marker: { color: PALETTE[i % PALETTE.length] },
              }))}
              layout={{
                margin: { t: 20, b: 40, l: 50, r: 20 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Plus Jakarta Sans', color: '#1E293B' },
                showlegend: false,
                height: 320,
                yaxis: { title: 'GPA', gridcolor: '#E2E8F0' },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          </GlassCard>
        )}
      </div>

      {/* Correlation */}
      {corr && (
        <GlassCard title="Behavioral Correlation Matrix" className="section">
          <Plot
            data={[
              {
                z: corr.matrix,
                x: corr.labels,
                y: corr.labels,
                type: 'heatmap',
                colorscale: [
                  [0, '#F5F3FF'],
                  [0.5, '#A78BFA'],
                  [1, '#8B5CF6'],
                ],
                text: corr.matrix.map((row) => row.map((v) => v.toFixed(2))),
                texttemplate: '%{text}',
                textfont: { size: 10 },
                showscale: true,
              },
            ]}
            layout={{
              margin: { t: 20, b: 100, l: 120, r: 20 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 11 },
              height: 450,
              xaxis: { tickangle: -45 },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </GlassCard>
      )}
    </div>
  );
}
