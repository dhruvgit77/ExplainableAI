import { useState, useRef, useEffect } from 'react';
import PlotObj from 'react-plotly.js';
import gsap from 'gsap';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Plot = PlotObj.default || PlotObj;
const PALETTE = { Pass: '#059669', 'At-Risk': '#D97706', Fail: '#DC2626' };

const REQUIRED_FIELDS = [
  'gender', 'region', 'board_type', 'parent_education', 'medium_of_instruction',
  'internet_quality', 'coaching_enrolled', 'financial_stress', 'num_subjects',
  'study_hours_per_week', 'sleep_hours_avg', 'extracurricular_count',
  'prev_cgpa', 'internal_marks_pct', 'assignment_completion_pct',
];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      const val = values[i];
      const num = Number(val);
      obj[h] = isNaN(num) || val === '' ? val : num;
    });
    return obj;
  });
}

function generateSampleCSV() {
  const header = REQUIRED_FIELDS.join(',');
  const rows = [
    'Male,North,CBSE,Graduate,English,4G/Good,Yes,3,5,22,7.5,2,8.2,78,85',
    'Female,South,ICSE,Post-Graduate,English,5G/Excellent,Yes,2,6,25,7,3,9.1,88,92',
    'Male,East,State Board,10th Pass,Hindi,2G/Slow,No,7,5,10,6,0,4.5,42,55',
    'Female,Northeast,CBSE,12th Pass,Regional,3G/Moderate,No,6,4,14,6.5,1,5.8,58,65',
    'Other,West,IB,Graduate,English,4G/Good,Yes,4,7,20,7,2,7.0,72,78',
  ];
  return header + '\n' + rows.join('\n');
}

export default function BatchPredict() {
  const [records, setRecords] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelectorAll('.gsap-fade'),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  useEffect(() => {
    if (!results || !containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelectorAll('.gsap-result'),
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, [results]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    setResults(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCSV(ev.target.result);
        if (parsed.length === 0) { setError('CSV is empty or malformed.'); return; }

        const missing = REQUIRED_FIELDS.filter((f) => !(f in parsed[0]));
        if (missing.length > 0) {
          setError(`Missing columns: ${missing.join(', ')}`);
          return;
        }
        setRecords(parsed);
      } catch (err) {
        setError('Failed to parse CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  async function handlePredict() {
    if (!records) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await api.predictBatch(records);
      setResults(res);
    } catch (err) {
      setError('Prediction failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadSample() {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_students.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const summary = results?.summary;
  const predictions = results?.predictions || [];

  return (
    <div ref={containerRef}>
      <div className="page-header">
        <h1>Batch Prediction</h1>
        <p>Upload a CSV of student profiles to predict outcomes for an entire class at once.</p>
      </div>

      <div className="grid-2 section">
        <GlassCard title="Upload Student CSV" className="gsap-fade">
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
            CSV must contain all 15 feature columns. 
            <button onClick={handleDownloadSample} style={{
              background: 'none', border: 'none', color: 'var(--color-primary)',
              cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', marginLeft: 6,
              fontFamily: 'inherit', fontSize: 'inherit',
            }}>Download sample CSV</button>
          </p>

          <div
            className="file-drop-zone"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) {
                const ev = { target: { files: [file] } };
                handleFileChange(ev);
              }
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ marginTop: 8, fontWeight: 600 }}>
              {fileName || 'Click or drag CSV file here'}
            </p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>

          {error && <div className="info-box error" style={{ marginTop: 12 }}>{error}</div>}

          {records && (
            <div style={{ marginTop: 16 }}>
              <div className="info-box success">✅ {records.length} students parsed from {fileName}</div>
              <button className="btn btn-primary" onClick={handlePredict} disabled={loading}
                style={{ width: '100%', marginTop: 12, padding: '12px 24px' }}>
                {loading ? 'Predicting...' : `⚡ Predict ${records.length} Students`}
              </button>
            </div>
          )}
        </GlassCard>

        <GlassCard title="Required CSV Columns" className="gsap-fade">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '0.8125rem' }}>
            {REQUIRED_FIELDS.map((f) => (
              <div key={f} style={{ padding: '4px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                <code style={{ fontSize: '0.75rem', background: 'var(--color-border-light)', padding: '2px 6px', borderRadius: 4 }}>
                  {f}
                </code>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {loading && <LoadingSpinner text={`Predicting ${records?.length || 0} students...`} />}

      {results && (
        <>
          <div className="divider" />

          {/* Summary */}
          <div className="grid-4 section">
            <div className="accent-metric gsap-result">
              <div className="metric-label">Total Students</div>
              <div className="metric-value">{summary.total}</div>
            </div>
            <div className="accent-metric gsap-result" style={{ borderLeftColor: '#059669' }}>
              <div className="metric-label">Pass</div>
              <div className="metric-value" style={{ color: '#059669' }}>{summary.pass}</div>
            </div>
            <div className="accent-metric gsap-result" style={{ borderLeftColor: '#D97706' }}>
              <div className="metric-label">At-Risk</div>
              <div className="metric-value" style={{ color: '#D97706' }}>{summary.at_risk}</div>
            </div>
            <div className="accent-metric gsap-result" style={{ borderLeftColor: '#DC2626' }}>
              <div className="metric-label">Fail</div>
              <div className="metric-value" style={{ color: '#DC2626' }}>{summary.fail}</div>
            </div>
          </div>

          <div className="grid-2 section">
            {/* Pie Chart */}
            <GlassCard title="Outcome Distribution" className="gsap-result">
              <Plot
                data={[{
                  labels: ['Pass', 'At-Risk', 'Fail'],
                  values: [summary.pass, summary.at_risk, summary.fail],
                  type: 'pie', hole: 0.5,
                  marker: { colors: ['#059669', '#D97706', '#DC2626'] },
                  textinfo: 'label+percent',
                  textfont: { family: 'Plus Jakarta Sans', size: 13 },
                }]}
                layout={{
                  margin: { t: 20, b: 20, l: 20, r: 20 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Plus Jakarta Sans', color: '#1E293B' },
                  height: 300, showlegend: false,
                }}
                config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
              />
            </GlassCard>

            {/* Confidence Histogram */}
            <GlassCard title="Confidence Distribution" className="gsap-result">
              <Plot
                data={[{
                  x: predictions.map((p) => p.confidence),
                  type: 'histogram', nbinsx: 15,
                  marker: { color: '#8B5CF6' },
                }]}
                layout={{
                  margin: { t: 10, b: 40, l: 50, r: 10 },
                  paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 11 },
                  xaxis: { title: 'Confidence %', gridcolor: '#E2E8F0' },
                  yaxis: { title: 'Students', gridcolor: '#E2E8F0' },
                  height: 300,
                }}
                config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
              />
            </GlassCard>
          </div>

          {/* Predictions Table */}
          <GlassCard title="Individual Predictions" className="section gsap-result">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Gender</th>
                    <th>Region</th>
                    <th>Board</th>
                    <th>CGPA</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{records[i]?.gender}</td>
                      <td>{records[i]?.region}</td>
                      <td>{records[i]?.board_type}</td>
                      <td>{records[i]?.prev_cgpa}</td>
                      <td>
                        <span className={`badge badge-${p.predicted_class === 'Pass' ? 'pass' : p.predicted_class === 'At-Risk' ? 'risk' : 'fail'}`}>
                          {p.predicted_class}
                        </span>
                      </td>
                      <td>{p.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
