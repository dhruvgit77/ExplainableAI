import { useState, useRef, useEffect } from 'react';
import PlotObj from 'react-plotly.js';
import gsap from 'gsap';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import StudentReport from '../components/StudentReport';
import StudentFeatureForm from '../components/StudentFeatureForm';
import AgenticProfile from '../components/AgenticProfile';
import ShapBarChart from '../components/ShapBarChart';
import CounterfactualPlan from '../components/CounterfactualPlan';
import ArtifactUpload from '../components/ArtifactUpload';

const Plot = PlotObj.default || PlotObj;

const defaults = {
  gender: 'Male',
  region: 'North',
  degree_type: 'B.Tech',
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
  // ── Modern AI-usage features (real survey-based) ──
  ai_reliance: 3,
  independent_after_ai: 3,
  ai_anxiety: 3,
  verify_ai_answers: 3,
  reduced_thinking_effort: 3,
  ai_assignment_pct: 50,
  multitask_studying: 2,
  shortform_consumption: 2,
  doomscroll_sleep: 2,
  nonstudy_screen_time: 3,
  ai_usage_frequency: '3-5/day',
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
        <p>Enter a student's <b>traditional academic record</b> and <b>modern AI-usage profile</b>. The system auto-extracts a third tier of <b>agentic features measured from the student's work</b>, then the three-tier <b>Full</b> model predicts and explains its decision with SHAP and LIME.</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <ArtifactUpload
          profile={form}
          onResult={(r) => {
            setResult(r);
            setShowReport(false);
            setCounterfactual(null);
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
          }}
        />
      </div>

      <form onSubmit={handleSubmit} ref={formRef}>
        <StudentFeatureForm form={form} update={update} />

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
              {result.agentic_features && (
                <AgenticProfile agentic={result.agentic_features} className="gsap-result" />
              )}
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
                          if (f.includes('integrity_flag')) advice = "Integrity: Address flagged AI misuse with supervised, AI-free assessments to rebuild academic trust.";
                          if (f.includes('copy_paste')) advice = "AI Habits: Reduce verbatim copy-pasting — rewrite AI output in own words and re-solve unaided.";
                          if (f.includes('concept_understanding')) advice = "Deep Learning: Use AI to explain step-by-step, then self-test to confirm genuine understanding.";
                          if (f.includes('original_work')) advice = "Ownership: Draft first and use AI only to review — keep authorship of submitted work.";
                          if (f.includes('verification')) advice = "Verification: Cross-check AI answers against notes/textbooks and run code to validate it.";
                          if (f.includes('dependency')) advice = "Balance: Schedule AI-free study blocks to rebuild independent problem-solving.";
                          if (f.includes('self_study')) advice = "Practice: Add regular unaided self-study sessions to improve retention.";
                          if (f.includes('prompt_quality') || f.includes('critical_thinking') || f.includes('problem_attempt') || f.includes('use_purpose')) advice = "Effective AI Use: Attempt first, prompt with context, and use AI to critique your reasoning.";
                          if (f.includes('digital_literacy')) advice = "Skills: Build core digital literacy via free courses (SWAYAM, Digital India).";

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
                <ShapBarChart shap={result.shap} predictedClass={result.predicted_class} className="gsap-result" />
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
            <div className="gsap-result" style={{ marginTop: 20 }}>
              <CounterfactualPlan counterfactual={counterfactual} />
            </div>
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
