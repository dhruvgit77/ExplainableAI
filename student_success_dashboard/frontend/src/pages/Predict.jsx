import { useState, useRef, useEffect } from 'react';
import PlotObj from 'react-plotly.js';
import gsap from 'gsap';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import StudentReport from '../components/StudentReport';

const Plot = PlotObj.default || PlotObj;

const defaults = {
  gender: 'Male',
  region: 'North',
  board_type: 'CBSE',
  parent_education: 'Graduate',
  medium_of_instruction: 'English',
  internet_quality: '4G/Good',
  coaching_enrolled: 'No',
  financial_stress: 4,
  num_subjects: 5,
  study_hours_per_week: 18,
  attendance_rate: 85,
  sleep_hours_avg: 7,
  extracurricular_count: 2,
  prev_cgpa: 7.5,
  internal_marks_pct: 72,
  assignment_completion_pct: 80,
};

export default function Predict() {
  const [form, setForm] = useState({ ...defaults });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [counterfactual, setCounterfactual] = useState(null);
  const [cfLoading, setCfLoading] = useState(false);
  const formRef = useRef(null);
  const resultRef = useRef(null);
  const reportRef = useRef(null);

  useEffect(() => {
    if (!formRef.current) return;
    gsap.fromTo(
      formRef.current.querySelectorAll('.glass-card'),
      { opacity: 0, y: 40, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  useEffect(() => {
    if (!result || !resultRef.current) return;
    gsap.fromTo(
      resultRef.current.querySelectorAll('.gsap-result'),
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, [result]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setShowReport(false);
    setCounterfactual(null);
    try {
      const res = await api.predict(form);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCounterfactual() {
    setCfLoading(true);
    try {
      const cf = await api.getCounterfactual(form);
      setCounterfactual(cf);
    } catch (err) { console.error(err); }
    finally { setCfLoading(false); }
  }

  function handleGenerateReport() {
    setShowReport(true);
    setTimeout(() => {
      if (reportRef.current) {
        reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        gsap.fromTo(
          reportRef.current,
          { opacity: 0, y: 40, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }
        );
      }
    }, 50);
  }

  function handlePrintReport() {
    window.print();
  }

  const resultClass = result
    ? result.predicted_class === 'Pass' ? 'pass'
      : result.predicted_class === 'At-Risk' ? 'at-risk' : 'fail'
    : '';

  return (
    <div>
      <div className="page-header">
        <h1>Live Prediction</h1>
        <p>Enter an Indian student's academic profile. The model predicts their outcome with SHAP and LIME explanations.</p>
      </div>

      <form onSubmit={handleSubmit} ref={formRef}>
        <div className="grid-3 section">
          {/* Academic Record */}
          <GlassCard title="Academic Record">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Previous CGPA (UGC 10-pt)</span>
                  <span className="slider-value">{form.prev_cgpa}</span>
                </div>
                <input type="range" min="1" max="10" step="0.1" value={form.prev_cgpa} onChange={(e) => update('prev_cgpa', parseFloat(e.target.value))} />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Internal Marks (%)</span>
                  <span className="slider-value">{form.internal_marks_pct}</span>
                </div>
                <input type="range" min="0" max="100" step="1" value={form.internal_marks_pct} onChange={(e) => update('internal_marks_pct', parseInt(e.target.value))} />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Assignment Completion (%)</span>
                  <span className="slider-value">{form.assignment_completion_pct}</span>
                </div>
                <input type="range" min="0" max="100" step="1" value={form.assignment_completion_pct} onChange={(e) => update('assignment_completion_pct', parseInt(e.target.value))} />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Study Hours / Week</span>
                  <span className="slider-value">{form.study_hours_per_week}</span>
                </div>
                <input type="range" min="0" max="40" step="1" value={form.study_hours_per_week} onChange={(e) => update('study_hours_per_week', parseInt(e.target.value))} />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Subjects Enrolled</span>
                  <span className="slider-value">{form.num_subjects}</span>
                </div>
                <input type="range" min="4" max="8" step="1" value={form.num_subjects} onChange={(e) => update('num_subjects', parseInt(e.target.value))} />
              </div>
            </div>
          </GlassCard>

          {/* Education System */}
          <GlassCard title="Education System">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Board Type</label>
                <select className="form-select" value={form.board_type} onChange={(e) => update('board_type', e.target.value)}>
                  <option>CBSE</option><option>ICSE</option><option>State Board</option><option>IB</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Medium of Instruction</label>
                <select className="form-select" value={form.medium_of_instruction} onChange={(e) => update('medium_of_instruction', e.target.value)}>
                  <option>English</option><option>Hindi</option><option>Regional</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Coaching Enrolled</label>
                <select className="form-select" value={form.coaching_enrolled} onChange={(e) => update('coaching_enrolled', e.target.value)}>
                  <option>Yes</option><option>No</option>
                </select>
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Attendance Rate (%)</span>
                  <span className="slider-value">{form.attendance_rate}%</span>
                </div>
                <input type="range" min="40" max="100" step="1" value={form.attendance_rate} onChange={(e) => update('attendance_rate', parseFloat(e.target.value))} />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Extracurricular Activities</span>
                  <span className="slider-value">{form.extracurricular_count}</span>
                </div>
                <input type="range" min="0" max="5" step="1" value={form.extracurricular_count} onChange={(e) => update('extracurricular_count', parseInt(e.target.value))} />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Avg Sleep (Hours)</span>
                  <span className="slider-value">{form.sleep_hours_avg}</span>
                </div>
                <input type="range" min="3" max="12" step="0.5" value={form.sleep_hours_avg} onChange={(e) => update('sleep_hours_avg', parseFloat(e.target.value))} />
              </div>
            </div>
          </GlassCard>

          {/* Demographics */}
          <GlassCard title="Demographics & Wellbeing">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Region</label>
                <select className="form-select" value={form.region} onChange={(e) => update('region', e.target.value)}>
                  <option>North</option><option>South</option><option>East</option>
                  <option>West</option><option>Northeast</option><option>Central</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Parent Education</label>
                <select className="form-select" value={form.parent_education} onChange={(e) => update('parent_education', e.target.value)}>
                  <option>Below 10th</option><option>10th Pass</option><option>12th Pass</option>
                  <option>Graduate</option><option>Post-Graduate</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Internet Quality</label>
                <select className="form-select" value={form.internet_quality} onChange={(e) => update('internet_quality', e.target.value)}>
                  <option>No Access</option><option>2G/Slow</option><option>3G/Moderate</option>
                  <option>4G/Good</option><option>5G/Excellent</option>
                </select>
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Financial Stress (1-10)</span>
                  <span className="slider-value">{form.financial_stress}</span>
                </div>
                <input type="range" min="1" max="10" step="1" value={form.financial_stress} onChange={(e) => update('financial_stress', parseInt(e.target.value))} />
              </div>
            </div>
          </GlassCard>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginBottom: 32, padding: '16px 28px', fontSize: '1rem' }}>
          {loading ? 'Predicting...' : '⚡ Predict Student Outcome'}
        </button>
      </form>

      {loading && <LoadingSpinner text="Running prediction with SHAP and LIME..." />}

      {result && (
        <div ref={resultRef}>
          <div className="divider" />
          <div className="grid-1-2 section">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className={`result-card ${resultClass} gsap-result`}>
                <div className="result-label">Predicted Outcome</div>
                <div className="result-value">{result.predicted_class}</div>
                <div className="result-confidence">Confidence: {result.confidence}%</div>
              </div>
              <GlassCard title="Data-Driven Interventions" className="gsap-result">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Global Status */}
                  <div>
                    {result.predicted_class === 'Pass' && <div className="info-box success"><b>Status: On Track.</b> Student shows strong mastery of core concepts. Focus on advanced enrichment.</div>}
                    {result.predicted_class === 'At-Risk' && <div className="info-box warning"><b>Status: Caution.</b> Performance is inconsistent. Targeted support required in weak areas.</div>}
                    {result.predicted_class === 'Fail' && <div className="info-box error"><b>Status: Urgent.</b> High probability of academic failure. Immediate intervention needed.</div>}
                  </div>
                  
                  {/* High Priority Warnings */}
                  {form.attendance_rate < 75 && (
                    <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #EF4444', borderRadius: 4, marginTop: 8 }}>
                      <h4 style={{ color: '#EF4444', margin: '0 0 4px 0', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        CRITICAL: Low Attendance Detected ({form.attendance_rate}%)
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                        Attendance below 75% is a massive predictor of academic failure. Immediate enrollment in the <b>Attendance Recovery Program</b> is required.
                      </p>
                    </div>
                  )}

                  {/* Specific Action Items based on SHAP */}
                  <div className="action-items">
                    <h4 style={{ fontSize: '0.875rem', marginBottom: 10, color: 'var(--color-primary)' }}>Recommended Action Items:</h4>
                    <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {result.shap.features
                        .map((feat, i) => ({ name: feat, val: result.shap.shap_values[i] }))
                        .filter(f => f.val < -0.05) // Only negative drivers
                        .slice(0, 3) // Top 3 issues
                        .map((issue, idx) => {
                          const f = issue.name.toLowerCase();
                          let advice = "";
                          if (f.includes('cgpa')) advice = "Schedule a foundational review of previous year's core concepts.";
                          if (f.includes('marks')) advice = "Enrol in subject-specific remedial 'clinics' to improve internal assessment scores.";
                          if (f.includes('assignment')) advice = "Implement a daily 'Planner Check' to ensure 100% assignment submission rate.";
                          if (f.includes('sleep')) advice = "Wellness Check: Advise on sleep hygiene (goal: 7-8 hours) to improve cognitive retention.";
                          if (f.includes('financial')) advice = "Admin Support: Evaluate eligibility for the 'Vidya Setu' scholarship or fee-deferment programs.";
                          if (f.includes('study_hours')) advice = "Time Management: Work with a mentor to build a structured 20-hour/week study timetable.";
                          if (f.includes('coaching')) advice = "Consider joining a peer-led study group to bridge the gap left by missing external coaching.";
                          if (f.includes('attendance')) {
                            if (form.attendance_rate < 75) {
                                advice = "Behavioral: Enroll in the 'Attendance Recovery Program' and set up weekly check-ins with a class mentor.";
                            } else {
                                return null; // Skip if it's not actually 'low'
                            }
                          }
                          if (f.includes('internet')) advice = "Infrastructure: Provide access to the campus digital library or offline study materials.";
                          
                          if (!advice) return null;
                          return (
                            <li key={idx} style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                              <span style={{ fontWeight: 700, color: '#DC2626' }}>● </span>
                              {advice}
                            </li>
                          );
                        })
                      }
                      {/* Default if everything is positive */}
                      {result.shap.shap_values.every(v => v >= -0.05) && (
                        <li style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                           Maintain current study habits and participate in peer-mentoring to help others.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </GlassCard>
              <GlassCard title="Probability Breakdown" className="gsap-result">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(result.probabilities).map(([cls, prob]) => (
                    <div key={cls}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{cls}</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ background: 'var(--color-border-light)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div className="progress-bar-animated" style={{
                          width: `${prob * 100}%`, height: '100%', borderRadius: 4,
                          background: cls === 'Pass' ? 'var(--color-pass)' : cls === 'At-Risk' ? 'var(--color-at-risk)' : 'var(--color-fail)',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {result.shap && (
                <GlassCard title="Why? (SHAP Explanation)" className="gsap-result">
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    Positive values (Green) pushed the student <b>towards</b> {result.predicted_class}.
                  </p>
                  <Plot
                    data={[{ 
                      y: result.shap.features.slice(0, 10).map((f, i) => {
                        const val = result.shap.feature_values[i];
                        // Clean up one-hot names: 'coaching_enrolled_Yes' with val 0 => 'Coaching: No'
                        let label = f.replace(/_/g, ' ');
                        if (f.includes('_Yes')) {
                          label = label.replace(' Yes', ': ') + (val === 1 ? 'Yes' : 'No');
                        } else if (f.includes('_No')) {
                          label = label.replace(' No', ': ') + (val === 1 ? 'No' : 'Yes');
                        } else if (label.includes('gender')) {
                          // Simple mapping for demo
                          label = 'Gender Impact';
                        }
                        return label;
                      }).reverse(), 
                      x: result.shap.shap_values.slice(0, 10).reverse(), 
                      type: 'bar', 
                      orientation: 'h',
                      marker: { color: result.shap.shap_values.slice(0, 10).map((v) => v >= 0 ? '#10B981' : '#EF4444').reverse() } 
                    }]}
                    layout={{ 
                      margin: { t: 10, b: 40, l: 180, r: 20 }, 
                      paper_bgcolor: 'rgba(0,0,0,0)', 
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 10 },
                      xaxis: { title: 'Impact', gridcolor: '#E2E8F0', zeroline: true, zerolinecolor: '#CBD5E1' },
                      yaxis: { automargin: true }, 
                      height: 340 
                    }}
                    config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
                  />
                </GlassCard>
              )}
              {result.lime && (
                <GlassCard title="Why? (LIME Explanation)" className="gsap-result">
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    Higher weights (Green) are the strongest predictors for this outcome.
                  </p>
                  <Plot
                    data={[{ 
                      y: result.lime.contributions.slice(0, 10).map((c) => {
                        let label = c.feature.split('=')[0].replace(/_/g, ' ');
                        if (label.includes(' Yes')) label = label.replace(' Yes', '');
                        return label;
                      }).reverse(),
                      x: result.lime.contributions.slice(0, 10).map((c) => c.weight).reverse(), 
                      type: 'bar', 
                      orientation: 'h',
                      marker: { color: result.lime.contributions.slice(0, 10).map((c) => (c.weight >= 0 ? '#10B981' : '#EF4444')).reverse() } 
                    }]}
                    layout={{ 
                      margin: { t: 10, b: 40, l: 180, r: 20 }, 
                      paper_bgcolor: 'rgba(0,0,0,0)', 
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 10 },
                      xaxis: { title: 'Evidence Weight', gridcolor: '#E2E8F0', zeroline: true, zerolinecolor: '#CBD5E1' },
                      yaxis: { automargin: true }, 
                      height: 340 
                    }}
                    config={{ displayModeBar: false, responsive: true }} style={{ width: '100%' }}
                  />
                </GlassCard>
              )}
            </div>
          </div>

          {/* Generate Report Button */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }} className="gsap-result">
            {!showReport ? (
              <button type="button" className="btn-report" onClick={handleGenerateReport}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                📄 Generate Student Report
              </button>
            ) : (
              <button type="button" className="btn-report" onClick={handlePrintReport}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                🖨️ Print / Save as PDF
              </button>
            )}
          </div>

          {/* Counterfactual What-If */}
          {result.predicted_class !== 'Pass' && (
            <div style={{ textAlign: 'center', marginTop: 16 }} className="gsap-result">
              {!counterfactual ? (
                <button type="button" className="btn-report" onClick={handleCounterfactual} disabled={cfLoading}>
                  🔄 {cfLoading ? 'Analyzing...' : 'What needs to change to Pass?'}
                </button>
              ) : null}
            </div>
          )}

          {counterfactual && (
            <GlassCard title="🎯 Counterfactual Analysis — What Needs to Change" className="gsap-result" style={{ marginTop: 20 }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 16 }}>{counterfactual.message}</p>
              {counterfactual.changes_needed && counterfactual.changes_needed.length > 0 ? (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>Feature</th><th>Current</th><th>→</th><th>Target</th><th>Change</th></tr>
                    </thead>
                    <tbody>
                      {counterfactual.changes_needed.map((ch, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{ch.feature.replace(/_/g, ' ')}</td>
                          <td>{ch.current_value}</td>
                          <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>→</td>
                          <td style={{ color: '#059669', fontWeight: 700 }}>{ch.target_value}</td>
                          <td style={{ color: ch.change > 0 ? '#059669' : '#DC2626', fontWeight: 600 }}>
                            {ch.change > 0 ? '+' : ''}{ch.change}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="info-box warning">Comprehensive academic support recommended — no single feature change is sufficient.</div>
              )}
              {counterfactual.achieved_pass && (
                <div className="info-box success" style={{ marginTop: 12 }}>✅ With these changes, the prediction flips to <strong>Pass</strong> ({counterfactual.final_confidence}% confidence).</div>
              )}
            </GlassCard>
          )}

          {/* Printable Report */}
          {showReport && (
            <div style={{ marginTop: 32 }}>
              <StudentReport ref={reportRef} formData={form} result={result} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
