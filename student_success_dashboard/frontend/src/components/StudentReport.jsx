import { forwardRef } from 'react';

/**
 * Map processed SHAP feature names back to human-readable Indian academic labels.
 */
const FEATURE_LABELS = {
  prev_cgpa: 'Previous CGPA',
  internal_marks_pct: 'Internal Marks (%)',
  assignment_completion_pct: 'Assignment Completion (%)',
  study_hours_per_week: 'Study Hours / Week',
  sleep_hours_avg: 'Average Sleep (hrs)',
  num_subjects: 'Subjects Enrolled',
  extracurricular_count: 'Extracurriculars',
  financial_stress: 'Financial Stress',
  gender: 'Gender',
  region: 'Region',
  board_type: 'Board Type',
  parent_education: 'Parent Education',
  medium_of_instruction: 'Medium of Instruction',
  internet_quality: 'Internet Quality',
  coaching_enrolled: 'Coaching Enrolled',
};

/**
 * Generate personalized improvement suggestions based on negative SHAP contributors.
 */
function getImprovementSuggestions(shapFeatures, shapValues, formData) {
  const suggestions = [];

  // Pair features with values, sort by most negative impact
  const pairs = shapFeatures.map((f, i) => ({ feature: f, value: shapValues[i] }));
  const negatives = pairs.filter((p) => p.value < -0.01).sort((a, b) => a.value - b.value);

  for (const { feature } of negatives.slice(0, 6)) {
    const f = feature.toLowerCase();

    if (f.includes('internal_marks') || f.includes('midterm')) {
      suggestions.push({
        area: 'Internal Assessment',
        icon: '📝',
        issue: `Internal marks (${formData.internal_marks_pct}%) are pulling down the prediction.`,
        action: 'Focus on regular class tests, viva preparation, and lab submissions. Consider joining a study group for weak subjects.',
      });
    } else if (f.includes('assignment_completion') || f.includes('assignment')) {
      suggestions.push({
        area: 'Assignment Completion',
        icon: '📋',
        issue: `Assignment completion rate (${formData.assignment_completion_pct}%) needs improvement.`,
        action: 'Set weekly deadlines for each assignment. Use a planner and break large assignments into daily tasks.',
      });
    } else if (f.includes('prev_cgpa') || f.includes('cgpa') || f.includes('gpa')) {
      suggestions.push({
        area: 'Academic Performance (CGPA)',
        icon: '📊',
        issue: `Previous CGPA (${formData.prev_cgpa}/10) is below the threshold for a strong prediction.`,
        action: 'Identify 2-3 weakest subjects and allocate extra study time. Consider tutoring or coaching for these subjects.',
      });
    } else if (f.includes('study_hours')) {
      suggestions.push({
        area: 'Study Hours',
        icon: '📚',
        issue: `Study hours (${formData.study_hours_per_week} hrs/week) are insufficient.`,
        action: 'Aim for 20-25 hrs/week of focused study. Use the Pomodoro technique (25 min study + 5 min break).',
      });
    } else if (f.includes('sleep')) {
      suggestions.push({
        area: 'Sleep & Health',
        icon: '😴',
        issue: `Average sleep (${formData.sleep_hours_avg} hrs) is affecting cognitive performance.`,
        action: 'Maintain 7-8 hrs of consistent sleep. Avoid screens 1 hour before bed. Regular exercise helps sleep quality.',
      });
    } else if (f.includes('financial_stress') || f.includes('financial')) {
      suggestions.push({
        area: 'Financial Wellbeing',
        icon: '💰',
        issue: `High financial stress (${formData.financial_stress}/10) is impacting academic focus.`,
        action: 'Explore government scholarships (NSP, State scholarships), fee waivers, and part-time campus opportunities.',
      });
    } else if (f.includes('internet') || f.includes('access')) {
      suggestions.push({
        area: 'Internet Access',
        icon: '🌐',
        issue: `Internet quality (${formData.internet_quality}) is limiting online learning.`,
        action: 'Use college/library Wi-Fi for heavy downloads. Download offline study materials. Check BSNL/Jio student plans.',
      });
    } else if (f.includes('coaching')) {
      suggestions.push({
        area: 'Coaching / Extra Support',
        icon: '🏫',
        issue: 'Lack of structured coaching support is a contributing factor.',
        action: 'Consider affordable online coaching (NPTEL, SWAYAM, Unacademy). Many offer free access for college students.',
      });
    } else if (f.includes('extracurricular')) {
      suggestions.push({
        area: 'Extracurricular Balance',
        icon: '🎯',
        issue: `Extracurricular activities (${formData.extracurricular_count}) may need balancing.`,
        action: 'Choose 1-2 meaningful activities. Quality over quantity — focus on depth rather than spreading thin.',
      });
    } else if (f.includes('medium') || f.includes('instruction')) {
      suggestions.push({
        area: 'Language & Communication',
        icon: '🗣️',
        issue: 'Medium of instruction may be affecting comprehension.',
        action: 'Practice reading textbooks in English daily. Join spoken English groups. Watch subject lectures on YouTube in English.',
      });
    } else if (f.includes('region') || f.includes('northeast') || f.includes('central')) {
      suggestions.push({
        area: 'Regional Support',
        icon: '🗺️',
        issue: 'Regional factors may limit access to resources.',
        action: 'Leverage digital India initiatives, SWAYAM MOOCs, and regional scholarship programs for your area.',
      });
    }
  }

  // If we have positive factors, add encouragement
  const positives = pairs.filter((p) => p.value > 0.05).sort((a, b) => b.value - a.value);

  // Deduplicate by area
  const seen = new Set();
  return suggestions.filter((s) => {
    if (seen.has(s.area)) return false;
    seen.add(s.area);
    return true;
  });
}

const StudentReport = forwardRef(function StudentReport({ formData, result }, ref) {
  if (!result) return null;

  const shapFeatures = result.shap?.features || [];
  const shapValues = result.shap?.shap_values || [];
  const limeContribs = result.lime?.contributions || [];

  const suggestions = getImprovementSuggestions(shapFeatures, shapValues, formData);

  // Top positive and negative SHAP factors
  const shapPairs = shapFeatures.map((f, i) => ({ feature: f, value: shapValues[i] }));
  const topPositive = shapPairs.filter((p) => p.value > 0).sort((a, b) => b.value - a.value).slice(0, 4);
  const topNegative = shapPairs.filter((p) => p.value < 0).sort((a, b) => a.value - b.value).slice(0, 4);

  const resultColor =
    result.predicted_class === 'Pass' ? '#059669'
      : result.predicted_class === 'At-Risk' ? '#D97706' : '#DC2626';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div ref={ref} className="student-report">
      {/* Header */}
      <div className="report-header">
        <div className="report-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="#8B5CF6" strokeWidth="2" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" stroke="#A78BFA" />
          </svg>
          <div>
            <strong style={{ fontSize: 16 }}>Vidya Setu</strong>
            <div style={{ fontSize: 10, color: '#6B7280' }}>Indian Student Success AI Platform</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#6B7280' }}>
          <div>Generated: {dateStr}</div>
          <div>Report ID: VS-{now.getTime().toString(36).toUpperCase()}</div>
        </div>
      </div>

      <h2 className="report-title">Student Performance Report</h2>

      {/* Student Profile + Result */}
      <div className="report-grid-2">
        <div className="report-card">
          <div className="report-card-title">Student Profile</div>
          <div className="report-profile-grid">
            <div><span className="report-label">Region:</span> {formData.region}</div>
            <div><span className="report-label">Board:</span> {formData.board_type}</div>
            <div><span className="report-label">CGPA:</span> {formData.prev_cgpa}/10</div>
            <div><span className="report-label">Internal Marks:</span> {formData.internal_marks_pct}%</div>
            <div><span className="report-label">Assignments:</span> {formData.assignment_completion_pct}%</div>
            <div><span className="report-label">Study Hrs/Wk:</span> {formData.study_hours_per_week}</div>
            <div><span className="report-label">Coaching:</span> {formData.coaching_enrolled}</div>
            <div><span className="report-label">Medium:</span> {formData.medium_of_instruction}</div>
          </div>
        </div>

        <div className="report-card" style={{ textAlign: 'center' }}>
          <div className="report-card-title">Prediction Result</div>
          <div className="report-result" style={{ color: resultColor }}>
            {result.predicted_class}
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Confidence: <strong>{result.confidence}%</strong>
          </div>
          <div className="report-probs">
            {Object.entries(result.probabilities).map(([cls, prob]) => (
              <div key={cls} className="report-prob-row">
                <span>{cls}</span>
                <div className="report-prob-bar">
                  <div style={{
                    width: `${prob * 100}%`,
                    background: cls === 'Pass' ? '#059669' : cls === 'At-Risk' ? '#D97706' : '#DC2626',
                  }} />
                </div>
                <span>{(prob * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Factors */}
      <div className="report-grid-2" style={{ marginTop: 12 }}>
        <div className="report-card">
          <div className="report-card-title" style={{ color: '#059669' }}>✅ Strengths (Helping)</div>
          {topPositive.length > 0 ? (
            <ul className="report-factor-list">
              {topPositive.map((p, i) => (
                <li key={i}>
                  <strong>{FEATURE_LABELS[p.feature] || p.feature}</strong>
                  <span className="report-shap positive">+{p.value.toFixed(3)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>No strong positive contributors found.</div>
          )}
        </div>
        <div className="report-card">
          <div className="report-card-title" style={{ color: '#DC2626' }}>⚠️ Weaknesses (Hurting)</div>
          {topNegative.length > 0 ? (
            <ul className="report-factor-list">
              {topNegative.map((p, i) => (
                <li key={i}>
                  <strong>{FEATURE_LABELS[p.feature] || p.feature}</strong>
                  <span className="report-shap negative">{p.value.toFixed(3)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>No significant weaknesses detected.</div>
          )}
        </div>
      </div>

      {/* Personalized Improvement Plan */}
      <div className="report-card" style={{ marginTop: 12 }}>
        <div className="report-card-title">📈 Personalized Improvement Plan</div>
        {suggestions.length > 0 ? (
          <div className="report-suggestions">
            {suggestions.map((s, i) => (
              <div key={i} className="report-suggestion">
                <div className="report-suggestion-header">
                  <span className="report-suggestion-icon">{s.icon}</span>
                  <strong>{s.area}</strong>
                </div>
                <div className="report-suggestion-issue">{s.issue}</div>
                <div className="report-suggestion-action">
                  <span className="report-action-label">Action:</span> {s.action}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#059669', padding: 8 }}>
            🎉 Great job! No major areas of concern identified. Keep up the current academic performance.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="report-footer">
        <div>Generated by <strong>Vidya Setu AI</strong> — Explainable AI for Indian Education</div>
        <div>Based on SHAP & LIME analysis • XGBoost Model • {dateStr}</div>
      </div>
    </div>
  );
});

export default StudentReport;
