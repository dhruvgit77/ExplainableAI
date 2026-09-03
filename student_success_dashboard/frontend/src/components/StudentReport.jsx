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
  degree_type: 'Degree Program',
  parent_education: 'Parent Education',
  medium_of_instruction: 'Medium of Instruction',
  internet_quality: 'Internet Quality',
  coaching_enrolled: 'Coaching Enrolled',
  // Modern AI-usage features (real survey-based)
  ai_reliance: 'Heavy AI Reliance',
  independent_after_ai: 'Independent After AI',
  ai_anxiety: 'Anxiety Without AI',
  verify_ai_answers: 'Verifies AI Answers',
  reduced_thinking_effort: 'Reduced Thinking Effort',
  ai_assignment_pct: 'Assignments Using AI (%)',
  multitask_studying: 'Phone Multitasking',
  shortform_consumption: 'Short-form Content',
  doomscroll_sleep: 'Doomscrolling',
  nonstudy_screen_time: 'Non-study Screen Time',
  ai_usage_frequency: 'AI Usage Frequency',
  // Agentic Tier-3 features (measured from the student's work)
  ai_authenticity_risk: 'AI-Authenticity Risk',
  stylometric_consistency: 'Stylometric Consistency',
  comprehension_depth: 'Comprehension Depth',
  reasoning_coherence: 'Reasoning Coherence',
  code_originality: 'Code Originality',
  cross_modal_consistency: 'Cross-Modal Consistency',
  learning_trajectory_slope: 'Learning Trajectory',
  knowledge_boundary_breadth: 'Knowledge Breadth',
  conceptual_error_rate: 'Conceptual Error Rate',
  authentic_engagement: 'Authentic Engagement',
  dominant_error_type: 'Dominant Error Type',
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
    } else if (f.includes('ai_reliance')) {
      suggestions.push({
        area: 'AI Over-Reliance',
        icon: '⚖️',
        issue: `Heavy reliance on AI for studying is weakening independent problem-solving.`,
        action: 'Set "AI-free" study blocks and attempt problems fully before consulting any tool.',
      });
    } else if (f.includes('independent_after_ai')) {
      suggestions.push({
        area: 'Independent Problem-Solving',
        icon: '🧠',
        issue: 'Difficulty solving similar problems independently after AI help signals surface-level learning.',
        action: 'After every AI explanation, close the tool and re-solve a similar problem unaided to confirm understanding.',
      });
    } else if (f.includes('verify_ai_answers')) {
      suggestions.push({
        area: 'Verifying AI Output',
        icon: '🔍',
        issue: 'AI answers are rarely verified before being trusted, risking learning wrong information.',
        action: 'Cross-check AI answers against textbooks/lecture notes and validate code by running it.',
      });
    } else if (f.includes('reduced_thinking_effort')) {
      suggestions.push({
        area: 'Independent Thinking',
        icon: '✍️',
        issue: 'AI has noticeably reduced the effort put into independent thinking.',
        action: 'Draft your own reasoning first, then use AI only to review and challenge it — keep authorship your own.',
      });
    } else if (f.includes('ai_assignment_pct')) {
      suggestions.push({
        area: 'Outsourcing Assignments',
        icon: '📋',
        issue: `A high share of assignments is done using AI, limiting genuine skill growth.`,
        action: 'Treat AI as a tutor, not an author. Attempt assignments yourself first and use AI to check, not to produce.',
      });
    } else if (f.includes('ai_anxiety')) {
      suggestions.push({
        area: 'AI Dependence Anxiety',
        icon: '😰',
        issue: 'Feeling anxious when AI is unavailable indicates unhealthy dependence.',
        action: 'Practice regular unaided study sessions to build confidence working without AI.',
      });
    } else if (f.includes('doomscroll') || f.includes('shortform') || f.includes('multitask') || f.includes('screen_time')) {
      suggestions.push({
        area: 'Digital Distraction',
        icon: '📱',
        issue: 'High screen time / doomscrolling / multitasking is eating into focused study and sleep.',
        action: 'Use focus blocks (phone in another room), limit short-form apps, and stop scrolling 1 hour before bed.',
      });
    } else if (f.includes('ai_usage_frequency')) {
      suggestions.push({
        area: 'AI Usage Intensity',
        icon: '🤖',
        issue: 'Very frequent AI use can crowd out independent practice.',
        action: 'Be intentional: attempt first, use AI for specific stuck points, and review its output critically.',
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
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="#0A0A0A" strokeWidth="2" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" stroke="#52525B" />
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
            <div><span className="report-label">Degree:</span> {formData.degree_type}</div>
            <div><span className="report-label">CGPA:</span> {formData.prev_cgpa}/10</div>
            <div><span className="report-label">Internal Marks:</span> {formData.internal_marks_pct}%</div>
            <div><span className="report-label">Assignments:</span> {formData.assignment_completion_pct}%</div>
            <div><span className="report-label">Study Hrs/Wk:</span> {formData.study_hours_per_week}</div>
            <div><span className="report-label">Coaching:</span> {formData.coaching_enrolled}</div>
            <div><span className="report-label">Medium:</span> {formData.medium_of_instruction}</div>
            <div><span className="report-label">AI Frequency:</span> {formData.ai_usage_frequency}</div>
            <div><span className="report-label">Assignments via AI:</span> {formData.ai_assignment_pct}%</div>
            <div><span className="report-label">Independent After AI:</span> {formData.independent_after_ai}/5</div>
            <div><span className="report-label">Verifies AI:</span> {formData.verify_ai_answers}/5</div>
            <div><span className="report-label">AI Reliance:</span> {formData.ai_reliance}/5</div>
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

      {/* Tier-3 Agentic Cognitive Profile (measured from the student's work) */}
      {result.agentic_features && (
        <div className="report-card" style={{ marginTop: 12 }}>
          <div className="report-card-title">🔬 Cognitive Profile (Measured from Work)</div>
          <div className="report-profile-grid">
            {[
              ['comprehension_depth', 'Comprehension Depth', '/100'],
              ['authentic_engagement', 'Authentic Engagement', '/100'],
              ['reasoning_coherence', 'Reasoning Coherence', '/100'],
              ['code_originality', 'Code Originality', '/100'],
              ['cross_modal_consistency', 'Cross-Modal Consistency', '/100'],
              ['knowledge_boundary_breadth', 'Knowledge Breadth', '/100'],
            ].map(([k, label, suffix]) => (
              <div key={k}>
                <span className="report-label">{label}:</span> {Math.round(result.agentic_features[k])}{suffix}
              </div>
            ))}
            <div>
              <span className="report-label">AI-Authenticity Risk:</span> {Math.round(result.agentic_features.ai_authenticity_risk * 100)}%
            </div>
            <div>
              <span className="report-label">Dominant Error:</span> {result.agentic_features.dominant_error_type}
            </div>
          </div>
        </div>
      )}

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
        <div>Based on SHAP & LIME analysis • Full XGBoost Model (Traditional + AI-usage + Agentic) • {dateStr}</div>
      </div>
    </div>
  );
});

export default StudentReport;
