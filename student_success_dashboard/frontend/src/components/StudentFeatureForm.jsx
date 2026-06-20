import GlassCard from './GlassCard';

/**
 * Shared field groups for a student's traditional + AI-era profile.
 * Used by both the sandbox Predict page and the teacher's real student editor.
 */
export default function StudentFeatureForm({ form, update }) {
  return (
    <>
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
              <label className="form-label">Degree Program</label>
              <select className="form-select" value={form.degree_type} onChange={(e) => update('degree_type', e.target.value)}>
                <option>B.Tech</option><option>B.E.</option><option>BCA</option><option>MCA</option><option>M.Tech</option><option>B.Com</option>
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

      <h3 className="section-title" style={{ marginTop: 8 }}>🤖 AI-Era Learning Profile</h3>
      <p style={{ marginTop: -8, marginBottom: 16, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Real AI-usage behaviour from the student survey — genuine AI-augmented learning vs. blind outsourcing and digital distraction.
      </p>
      <div className="grid-3 section">
        {/* AI Dependency & Independent Thinking (real Likert items, 1-5) */}
        <GlassCard title="AI Dependency & Thinking">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Likert form={form} update={update} field="ai_reliance" label="Relies heavily on AI for studying" />
            <Likert form={form} update={update} field="independent_after_ai" label="Can solve problems independently after AI" />
            <Likert form={form} update={update} field="ai_anxiety" label="Feels anxious when AI is unavailable" />
            <Likert form={form} update={update} field="verify_ai_answers" label="Verifies AI answers before trusting" />
            <Likert form={form} update={update} field="reduced_thinking_effort" label="AI has reduced independent-thinking effort" />
          </div>
        </GlassCard>

        {/* AI Usage intensity */}
        <GlassCard title="AI Usage">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">AI Usage Frequency</label>
              <select className="form-select" value={form.ai_usage_frequency} onChange={(e) => update('ai_usage_frequency', e.target.value)}>
                <option value="Never">Never</option>
                <option value="1-3/day">1–3 times/day</option>
                <option value="3-5/day">3–5 times/day</option>
                <option value="5+/day">5+ times/day</option>
              </select>
            </div>
            <div className="slider-group">
              <div className="slider-header">
                <span className="form-label">Assignments Done Using AI (%)</span>
                <span className="slider-value">{form.ai_assignment_pct}%</span>
              </div>
              <input type="range" min="0" max="100" step="1" value={form.ai_assignment_pct} onChange={(e) => update('ai_assignment_pct', parseInt(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Daily Non-Study Screen Time</label>
              <select className="form-select" value={form.nonstudy_screen_time} onChange={(e) => update('nonstudy_screen_time', parseFloat(e.target.value))}>
                <option value={1}>Under 2 hrs</option>
                <option value={3}>2–4 hrs</option>
                <option value={5}>4–6 hrs</option>
                <option value={7}>6+ hrs</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Digital Behaviour (real items, 1-4 frequency) */}
        <GlassCard title="Digital Habits">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Frequency form={form} update={update} field="multitask_studying" label="Multitasks on phone while studying" />
            <Frequency form={form} update={update} field="shortform_consumption" label="Consumes short-form content" />
            <Frequency form={form} update={update} field="doomscroll_sleep" label="Doomscrolls before sleeping" />
          </div>
        </GlassCard>
      </div>
    </>
  );
}

const LIKERT_LABELS = { 1: 'Strongly Disagree', 2: 'Disagree', 3: 'Neutral', 4: 'Agree', 5: 'Strongly Agree' };
const FREQ_LABELS = { 1: 'Rarely', 2: 'Sometimes', 3: 'Often', 4: 'Very Often' };

function Likert({ form, update, field, label }) {
  return (
    <div className="slider-group">
      <div className="slider-header">
        <span className="form-label">{label}</span>
        <span className="slider-value">{LIKERT_LABELS[form[field]]}</span>
      </div>
      <input type="range" min="1" max="5" step="1" value={form[field]} onChange={(e) => update(field, parseInt(e.target.value))} />
    </div>
  );
}

function Frequency({ form, update, field, label }) {
  return (
    <div className="slider-group">
      <div className="slider-header">
        <span className="form-label">{label}</span>
        <span className="slider-value">{FREQ_LABELS[form[field]]}</span>
      </div>
      <input type="range" min="1" max="4" step="1" value={form[field]} onChange={(e) => update(field, parseInt(e.target.value))} />
    </div>
  );
}
