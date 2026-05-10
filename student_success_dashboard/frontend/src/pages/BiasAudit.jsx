import { useState, useEffect } from 'react';
import PlotObj from 'react-plotly.js';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useGsapOnData } from '../hooks/useGsap';

const Plot = PlotObj.default || PlotObj;
const PALETTE = ['#8B5CF6', '#A78BFA', '#6D28D9', '#DDD6FE', '#C4B5FD', '#EDE9FE'];

const ATTR_LABELS = {
  gender: 'Gender',
  region: 'Region',
  board_type: 'Board Type',
  parent_education: 'Parent Education',
  medium_of_instruction: 'Medium of Instruction',
  internet_quality: 'Internet Quality',
  coaching_enrolled: 'Coaching Enrolled',
};

export default function BiasAudit() {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAttr, setSelectedAttr] = useState('all');
  const containerRef = useGsapOnData(audit, '.gsap-fade');

  useEffect(() => {
    api.getBiasAudit().then(setAudit).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Auditing fairness across Indian demographics..." />;
  if (!audit) return <p>Failed to load bias audit.</p>;

  const allAttributes = [...new Set(audit.map((r) => r.attribute))];
  const filteredAudit = selectedAttr === 'all' ? audit : audit.filter((r) => r.attribute === selectedAttr);

  // Group data for charts
  const chartGroups = {};
  allAttributes.forEach((attr) => {
    chartGroups[attr] = audit.filter((r) => r.attribute === attr);
  });

  return (
    <div ref={containerRef}>
      <div className="page-header">
        <h1>Fairness & Bias Audit</h1>
        <p>
          Comprehensive equity analysis across <strong>all 7 demographic attributes</strong> —
          gender, region, board type, parent education, medium, internet quality, and coaching status.
        </p>
      </div>

      {/* Filter */}
      <div className="section gsap-fade" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          className={`btn-filter ${selectedAttr === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedAttr('all')}
        >All Attributes</button>
        {allAttributes.map((attr) => (
          <button
            key={attr}
            className={`btn-filter ${selectedAttr === attr ? 'active' : ''}`}
            onClick={() => setSelectedAttr(attr)}
          >{ATTR_LABELS[attr] || attr}</button>
        ))}
      </div>

      {/* Scorecard Table */}
      <GlassCard title="Audit Scorecard" className="section gsap-fade">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Attribute</th>
                <th>Group</th>
                <th>Count</th>
                <th>Accuracy</th>
                <th>Pass Rate</th>
                <th>Equal Opp.</th>
                <th>Stat. Parity</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudit.map((row, i) => {
                const isLow = row.accuracy < 0.9;
                const spdFlag = Math.abs(row.statistical_parity_diff) > 0.05;
                return (
                  <tr key={i} style={{ backgroundColor: isLow ? '#FEF2F2' : spdFlag ? '#FFFBEB' : undefined }}>
                    <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{ATTR_LABELS[row.attribute] || row.attribute}</td>
                    <td>{row.group}</td>
                    <td>{row.count}</td>
                    <td>{(row.accuracy * 100).toFixed(1)}%</td>
                    <td>{(row.predicted_pass_rate * 100).toFixed(1)}%</td>
                    <td>{row.equal_opportunity != null ? (row.equal_opportunity * 100).toFixed(1) + '%' : 'N/A'}</td>
                    <td style={{ color: Math.abs(row.statistical_parity_diff) > 0.05 ? '#DC2626' : '#059669', fontWeight: 600 }}>
                      {row.statistical_parity_diff > 0 ? '+' : ''}{(row.statistical_parity_diff * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="divider" />

      {/* Accuracy Charts per Attribute */}
      <h3 className="section-title">Accuracy by Subgroup</h3>
      <div className="grid-2 section">
        {allAttributes.map((attr, ai) => {
          const groups = chartGroups[attr];
          return (
            <GlassCard key={attr} title={ATTR_LABELS[attr] || attr} className="gsap-fade">
              <Plot
                data={[{
                  x: groups.map((g) => g.group),
                  y: groups.map((g) => g.accuracy),
                  type: 'bar',
                  marker: { color: groups.map((_, i) => PALETTE[i % PALETTE.length]) },
                }]}
                layout={{
                  margin: { t: 10, b: 60, l: 55, r: 10 },
                  paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 10 },
                  yaxis: { title: 'Accuracy', gridcolor: '#E2E8F0', range: [0.85, 1.0] },
                  xaxis: { tickangle: -30 },
                  height: 260, showlegend: false,
                  shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: 0.95, y1: 0.95, line: { dash: 'dot', color: '#94A3B8', width: 1 } }],
                }}
                config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
              />
            </GlassCard>
          );
        })}
      </div>

      <div className="divider" />

      {/* Statistical Parity */}
      <h3 className="section-title">Statistical Parity Difference</h3>
      <p style={{ marginBottom: 16, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Difference between group pass rate and overall pass rate. Values near 0 indicate fairness.
      </p>
      <GlassCard className="section gsap-fade">
        <Plot
          data={[{
            y: filteredAudit.map((r) => `${ATTR_LABELS[r.attribute] || r.attribute}: ${r.group}`),
            x: filteredAudit.map((r) => r.statistical_parity_diff),
            type: 'bar', orientation: 'h',
            marker: {
              color: filteredAudit.map((r) =>
                Math.abs(r.statistical_parity_diff) > 0.05 ? '#DC2626' : '#059669'
              ),
            },
          }]}
          layout={{
            margin: { t: 10, b: 40, l: 220, r: 20 },
            paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 11 },
            xaxis: { title: 'Statistical Parity Diff', gridcolor: '#E2E8F0', zeroline: true, zerolinecolor: '#1E293B' },
            yaxis: { automargin: true },
            height: Math.max(300, filteredAudit.length * 28),
            shapes: [
              { type: 'line', yref: 'paper', y0: 0, y1: 1, x0: -0.05, x1: -0.05, line: { dash: 'dot', color: '#DC2626', width: 1 } },
              { type: 'line', yref: 'paper', y0: 0, y1: 1, x0: 0.05, x1: 0.05, line: { dash: 'dot', color: '#DC2626', width: 1 } },
            ],
          }}
          config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
        />
      </GlassCard>

      <div className="info-box gsap-fade" style={{ marginTop: 8 }}>
        <strong>Key Findings:</strong> Groups with |Statistical Parity Diff| &gt; 5% (red bars) indicate potential bias.
        Consider re-weighting, adversarial debiasing, or targeted data collection for underrepresented groups.
      </div>
    </div>
  );
}
