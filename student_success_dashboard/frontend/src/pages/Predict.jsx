import { useState } from 'react';
import PlotObj from 'react-plotly.js';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Plot = PlotObj.default || PlotObj;
const defaults = {
  gender: 'Male',
  region: 'Urban',
  parent_education_level: 'Bachelors',
  internet_access_quality: 'Good',
  num_courses_enrolled: 5,
  study_hours_per_week: 15,
  sleep_hours_avg: 7,
  extracurricular_count: 1,
  prev_gpa: 3.2,
  assignment_submission_rate: 85,
  midterm_score: 75,
  financial_stress_index: 5,
};

export default function Predict() {
  const [form, setForm] = useState({ ...defaults });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.predict(form);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const resultClass = result
    ? result.predicted_class === 'Pass'
      ? 'pass'
      : result.predicted_class === 'At-Risk'
      ? 'at-risk'
      : 'fail'
    : '';

  return (
    <div>
      <div className="page-header">
        <h1>Live Prediction</h1>
        <p>
          Simulate a student profile. The model will predict their outcome and provide
          SHAP and LIME explanations of the key factors.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid-3 section">
          {/* Academic Record */}
          <GlassCard title="Academic Record">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Previous GPA</span>
                  <span className="slider-value">{form.prev_gpa}</span>
                </div>
                <input
                  type="range" min="1" max="4" step="0.1"
                  value={form.prev_gpa}
                  onChange={(e) => update('prev_gpa', parseFloat(e.target.value))}
                />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Study Hours / Week</span>
                  <span className="slider-value">{form.study_hours_per_week}</span>
                </div>
                <input
                  type="range" min="0" max="40" step="1"
                  value={form.study_hours_per_week}
                  onChange={(e) => update('study_hours_per_week', parseInt(e.target.value))}
                />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Midterm Score (%)</span>
                  <span className="slider-value">{form.midterm_score}</span>
                </div>
                <input
                  type="range" min="0" max="100" step="1"
                  value={form.midterm_score}
                  onChange={(e) => update('midterm_score', parseInt(e.target.value))}
                />
              </div>
            </div>
          </GlassCard>

          {/* Behavioral */}
          <GlassCard title="Behavioral Indicators">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Assignment Submission (%)</span>
                  <span className="slider-value">{form.assignment_submission_rate}</span>
                </div>
                <input
                  type="range" min="0" max="100" step="1"
                  value={form.assignment_submission_rate}
                  onChange={(e) => update('assignment_submission_rate', parseInt(e.target.value))}
                />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Courses Enrolled</span>
                  <span className="slider-value">{form.num_courses_enrolled}</span>
                </div>
                <input
                  type="range" min="3" max="7" step="1"
                  value={form.num_courses_enrolled}
                  onChange={(e) => update('num_courses_enrolled', parseInt(e.target.value))}
                />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Extracurricular Activities</span>
                  <span className="slider-value">{form.extracurricular_count}</span>
                </div>
                <input
                  type="range" min="0" max="4" step="1"
                  value={form.extracurricular_count}
                  onChange={(e) => update('extracurricular_count', parseInt(e.target.value))}
                />
              </div>
            </div>
          </GlassCard>

          {/* Demographics */}
          <GlassCard title="Demographics and Wellbeing">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Avg Sleep (Hours)</span>
                  <span className="slider-value">{form.sleep_hours_avg}</span>
                </div>
                <input
                  type="range" min="3" max="12" step="0.5"
                  value={form.sleep_hours_avg}
                  onChange={(e) => update('sleep_hours_avg', parseFloat(e.target.value))}
                />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span className="form-label">Financial Stress (1-10)</span>
                  <span className="slider-value">{form.financial_stress_index}</span>
                </div>
                <input
                  type="range" min="1" max="10" step="1"
                  value={form.financial_stress_index}
                  onChange={(e) => update('financial_stress_index', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Non-binary</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Region</label>
                <select className="form-select" value={form.region} onChange={(e) => update('region', e.target.value)}>
                  <option>Urban</option>
                  <option>Suburban</option>
                  <option>Rural</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Parent Education</label>
                <select className="form-select" value={form.parent_education_level} onChange={(e) => update('parent_education_level', e.target.value)}>
                  <option>High School</option>
                  <option>Bachelors</option>
                  <option>Masters</option>
                  <option>PhD</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Internet Quality</label>
                <select className="form-select" value={form.internet_access_quality} onChange={(e) => update('internet_access_quality', e.target.value)}>
                  <option>Poor</option>
                  <option>Average</option>
                  <option>Good</option>
                  <option>Excellent</option>
                </select>
              </div>
            </div>
          </GlassCard>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginBottom: 32, padding: '16px 28px', fontSize: '1rem' }}>
          {loading ? 'Predicting...' : 'Predict Student Outcome'}
        </button>
      </form>

      {loading && <LoadingSpinner text="Running prediction with SHAP and LIME..." />}

      {result && (
        <>
          <div className="divider" />

          <div className="grid-1-2 section">
            {/* Left: Result + Intervention */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className={`result-card ${resultClass}`}>
                <div className="result-label">Predicted Outcome</div>
                <div className="result-value">{result.predicted_class}</div>
                <div className="result-confidence">Confidence: {result.confidence}%</div>
              </div>

              <GlassCard title="Suggested Interventions">
                {result.predicted_class === 'Pass' && (
                  <div className="info-box success">
                    Student is on track. Continue current academic support.
                  </div>
                )}
                {result.predicted_class === 'At-Risk' && (
                  <div className="info-box warning">
                    Early intervention recommended. Review assignment submissions and midterm feedback.
                  </div>
                )}
                {result.predicted_class === 'Fail' && (
                  <div className="info-box error">
                    Urgent intervention needed. Academic advising and tutoring support required immediately.
                  </div>
                )}
              </GlassCard>

              {/* Probability Breakdown */}
              <GlassCard title="Probability Breakdown">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(result.probabilities).map(([cls, prob]) => (
                    <div key={cls}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{cls}</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ background: 'var(--color-border-light)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${prob * 100}%`,
                            height: '100%',
                            borderRadius: 4,
                            background: cls === 'Pass' ? 'var(--color-pass)' : cls === 'At-Risk' ? 'var(--color-at-risk)' : 'var(--color-fail)',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Right: Explanations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* SHAP */}
              {result.shap && (
                <GlassCard title="Why? (SHAP Explanation)">
                  <Plot
                    data={[
                      {
                        y: result.shap.features,
                        x: result.shap.shap_values,
                        type: 'bar',
                        orientation: 'h',
                        marker: {
                          color: result.shap.shap_values.map((v) =>
                            v >= 0 ? '#8B5CF6' : '#94A3B8'
                          ),
                        },
                      },
                    ]}
                    layout={{
                      margin: { t: 10, b: 40, l: 180, r: 20 },
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 11 },
                      xaxis: { title: 'SHAP Value', gridcolor: '#E2E8F0', zeroline: true, zerolinecolor: '#CBD5E1' },
                      yaxis: { automargin: true },
                      height: 380,
                    }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%' }}
                  />
                </GlassCard>
              )}

              {/* LIME */}
              {result.lime && (
                <GlassCard title="Why? (LIME Explanation)">
                  <Plot
                    data={[
                      {
                        y: result.lime.contributions.map((c) => c.feature).reverse(),
                        x: result.lime.contributions.map((c) => c.weight).reverse(),
                        type: 'bar',
                        orientation: 'h',
                        marker: {
                          color: result.lime.contributions
                            .map((c) => (c.weight >= 0 ? '#8B5CF6' : '#94A3B8'))
                            .reverse(),
                        },
                      },
                    ]}
                    layout={{
                      margin: { t: 10, b: 40, l: 220, r: 20 },
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      font: { family: 'Plus Jakarta Sans', color: '#1E293B', size: 11 },
                      xaxis: { title: 'LIME Weight', gridcolor: '#E2E8F0', zeroline: true, zerolinecolor: '#CBD5E1' },
                      yaxis: { automargin: true },
                      height: 380,
                    }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%' }}
                  />
                </GlassCard>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
