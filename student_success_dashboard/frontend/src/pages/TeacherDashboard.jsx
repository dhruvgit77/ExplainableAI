import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StudentFeatureForm from '../components/StudentFeatureForm';
import StudentReport from '../components/StudentReport';
import ReportInsights from '../components/ReportInsights';

function badgeClass(predictedClass) {
  if (predictedClass === 'Pass') return 'pass';
  if (predictedClass === 'At-Risk') return 'risk';
  if (predictedClass === 'Fail') return 'fail';
  return '';
}

export default function TeacherDashboard() {
  const { auth } = useAuth();
  const [students, setStudents] = useState(null);
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (!students || !containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelectorAll('.gsap-fade'),
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }
    );

    const counters = containerRef.current.querySelectorAll('.dash-stat-value[data-count]');
    counters.forEach((el) => {
      const target = Number(el.dataset.count) || 0;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(obj.val); },
      });
    });
  }, [students]);

  async function loadStudents() {
    try {
      const data = await api.getTeacherStudents();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function openStudent(id, name) {
    setActiveId(id);
    setStudentName(name);
    setForm(null);
    setReport(null);
    setModalError('');
    setModalLoading(true);
    try {
      const data = await api.getTeacherStudent(id);
      setForm(data.profile);
      if (data.latest_report) {
        setReport({ formData: data.latest_report.profile_snapshot, result: data.latest_report.result });
      }
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    setActiveId(null);
    setForm(null);
    setReport(null);
    setModalError('');
  }

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSaveAndGenerate() {
    if (!activeId || !form) return;
    setSaving(true);
    setModalError('');
    try {
      await api.updateTeacherStudent(activeId, form);
      const result = await api.generateReport(activeId);
      setReport({ formData: result.profile_snapshot, result: result.result });
      loadStudents();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const total = students?.length || 0;
  const withReport = students?.filter((s) => s.latest_class) || [];
  const pass = withReport.filter((s) => s.latest_class === 'Pass').length;
  const atRisk = withReport.filter((s) => s.latest_class === 'At-Risk').length;
  const fail = withReport.filter((s) => s.latest_class === 'Fail').length;
  const notAssessed = total - withReport.length;

  return (
    <div ref={containerRef}>
      <div className="dash-hero">
        <div className="dash-hero-eyebrow"><span className="dot" /> Teacher Console</div>
        <h1>Welcome, {auth?.name}</h1>
        <p>Review and update each student's academic record and AI-usage profile, then generate their explainable report.</p>
      </div>

      {error && <div className="info-box error section">{error}</div>}

      {!students ? (
        <LoadingSpinner text="Loading your class..." />
      ) : (
        <>
          <div className="dash-stat-grid">
            <div className="dash-stat-card dash-stat-card--total gsap-fade">
              <div className="dash-stat-icon">👥</div>
              <div className="dash-stat-label">Total Students</div>
              <div className="dash-stat-value" data-count={total}>0</div>
            </div>
            <div className="dash-stat-card dash-stat-card--pass gsap-fade">
              <div className="dash-stat-icon">✅</div>
              <div className="dash-stat-label">Pass</div>
              <div className="dash-stat-value" data-count={pass}>0</div>
            </div>
            <div className="dash-stat-card dash-stat-card--risk gsap-fade">
              <div className="dash-stat-icon">⚠️</div>
              <div className="dash-stat-label">At-Risk</div>
              <div className="dash-stat-value" data-count={atRisk}>0</div>
            </div>
            <div className="dash-stat-card dash-stat-card--fail gsap-fade">
              <div className="dash-stat-icon">⛔</div>
              <div className="dash-stat-label">Fail</div>
              <div className="dash-stat-value" data-count={fail}>0</div>
            </div>
            <div className="dash-stat-card dash-stat-card--muted gsap-fade">
              <div className="dash-stat-icon">📭</div>
              <div className="dash-stat-label">Not Yet Assessed</div>
              <div className="dash-stat-value" data-count={notAssessed}>0</div>
            </div>
          </div>

          {total === 0 ? (
            <div className="dash-empty-state gsap-fade">
              <div className="empty-state-icon" style={{ fontSize: '3.5rem', marginBottom: 12 }}>👩‍🏫</div>
              <h3 style={{ marginBottom: 8 }}>No students yet</h3>
              <p>
                Ask your students to sign up and select <strong>{auth?.name}</strong> as their teacher.
                They’ll appear here automatically, and you can then fill in their profile and generate a report.
              </p>
            </div>
          ) : (
          <div className="dash-table-card gsap-fade">
            <div className="dash-section-title"><span className="bar" /> My Students</div>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>Last Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id}>
                      <td>{i + 1}</td>
                      <td>{s.name}</td>
                      <td><code>{s.username}</code></td>
                      <td>
                        {s.latest_class ? (
                          <span className={`dash-badge ${badgeClass(s.latest_class)}`}>{s.latest_class}</span>
                        ) : (
                          <span style={{ color: 'var(--cosmic-text-muted)', fontSize: '0.8125rem' }}>Not assessed</span>
                        )}
                      </td>
                      <td>{s.latest_confidence != null ? `${s.latest_confidence}%` : '—'}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--cosmic-text-muted)' }}>
                        {s.last_updated ? new Date(s.last_updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <button className="dash-btn-edit" onClick={() => openStudent(s.id, s.name)}>
                          Edit & Generate Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </>
      )}

      {activeId && (
        <div className="dash-modal-overlay" onClick={closeModal}>
          <div className="dash-modal-panel" onClick={(e) => e.stopPropagation()}>
            <button className="dash-modal-close" onClick={closeModal}>×</button>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ marginBottom: 4 }}>{studentName}</h2>
              <p>Update the student's profile, then generate an explainable Full-model report (academic + AI-usage + agentic measured-from-work signal).</p>
            </div>

            {modalLoading && <LoadingSpinner text="Loading student profile..." />}
            {modalError && <div className="info-box error" style={{ marginBottom: 16 }}>{modalError}</div>}

            {form && !modalLoading && (
              <>
                <StudentFeatureForm form={form} update={update} />
                <button
                  className="auth-submit"
                  onClick={handleSaveAndGenerate}
                  disabled={saving}
                  style={{ marginBottom: 24 }}
                >
                  {saving ? 'Saving & Generating...' : '💾 Save & Generate Report'}
                </button>
              </>
            )}

            {report && (
              <>
                <div className="divider" />
                <h3 className="section-title">Prediction & Explanation</h3>
                <ReportInsights result={report.result} />

                <div className="divider" />
                <h3 className="section-title">Printable Report</h3>
                <div className="dash-report-frame">
                  <StudentReport formData={report.formData} result={report.result} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
