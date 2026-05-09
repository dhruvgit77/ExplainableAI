import { useState, useEffect } from 'react';
import PlotObj from 'react-plotly.js';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Plot = PlotObj.default || PlotObj;

export default function BiasAudit() {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBiasAudit()
      .then(setAudit)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Calculating fairness metrics..." />;
  if (!audit) return <p>Failed to load bias audit.</p>;

  const genderData = audit.filter((r) => r.attribute === 'gender');
  const regionData = audit.filter((r) => r.attribute === 'region');

  return (
    <div>
      <div className="page-header">
        <h1>Fairness and Bias Audit</h1>
        <p>
          AI models can unintentionally learn biases present in training data. This page audits the
          XGBoost model to ensure equitable performance across demographic groups.
        </p>
      </div>

      {/* Audit Table */}
      <GlassCard title="Audit Scorecard" className="section">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Attribute</th>
                <th>Group</th>
                <th>Count</th>
                <th>Accuracy</th>
                <th>Predicted Pass Rate</th>
                <th>Equal Opportunity</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((row, i) => {
                const isLow = row.accuracy < 0.9 || row.predicted_pass_rate < 0.1;
                return (
                  <tr key={i} style={isLow ? { backgroundColor: '#FEF2F2' } : {}}>
                    <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{row.attribute}</td>
                    <td>{row.group}</td>
                    <td>{row.count}</td>
                    <td>{(row.accuracy * 100).toFixed(1)}%</td>
                    <td>{(row.predicted_pass_rate * 100).toFixed(1)}%</td>
                    <td>{row.equal_opportunity != null ? (row.equal_opportunity * 100).toFixed(1) + '%' : 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="divider" />

      <h3 className="section-title">Visualizing Disparities</h3>

      <div className="grid-2 section">
        {/* Accuracy by Subgroup */}
        <GlassCard title="Model Accuracy by Subgroup">
          <Plot
            data={[
              {
                x: genderData.map((r) => r.group),
                y: genderData.map((r) => r.accuracy),
                type: 'bar',
                name: 'Gender',
                marker: { color: '#8B5CF6' },
              },
              {
                x: regionData.map((r) => r.group),
                y: regionData.map((r) => r.accuracy),
                type: 'bar',
                name: 'Region',
                marker: { color: '#A78BFA' },
              },
            ]}
            layout={{
              barmode: 'group',
              margin: { t: 20, b: 40, l: 60, r: 20 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 12 },
              yaxis: { title: 'Accuracy', gridcolor: '#E2E8F0', range: [0.85, 1.0] },
              legend: { orientation: 'h', y: -0.2 },
              height: 320,
              shapes: [
                {
                  type: 'line',
                  xref: 'paper',
                  x0: 0,
                  x1: 1,
                  y0: 0.97,
                  y1: 0.97,
                  line: { dash: 'dot', color: '#94A3B8', width: 1 },
                },
              ],
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </GlassCard>

        {/* Pass Rate by Subgroup */}
        <GlassCard title="Predicted Pass Rate by Subgroup">
          <Plot
            data={[
              {
                x: genderData.map((r) => r.group),
                y: genderData.map((r) => r.predicted_pass_rate),
                type: 'bar',
                name: 'Gender',
                marker: { color: '#8B5CF6' },
              },
              {
                x: regionData.map((r) => r.group),
                y: regionData.map((r) => r.predicted_pass_rate),
                type: 'bar',
                name: 'Region',
                marker: { color: '#A78BFA' },
              },
            ]}
            layout={{
              barmode: 'group',
              margin: { t: 20, b: 40, l: 60, r: 20 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 12 },
              yaxis: { title: 'Pass Rate', gridcolor: '#E2E8F0' },
              legend: { orientation: 'h', y: -0.2 },
              height: 320,
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </GlassCard>
      </div>

      <div className="info-box" style={{ marginTop: 8 }}>
        <strong>Next Step:</strong> Based on these results, we can apply Sample Re-weighting
        or Adversarial Debiasing to improve fairness for identified groups.
      </div>
    </div>
  );
}
