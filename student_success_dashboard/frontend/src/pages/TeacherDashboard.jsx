import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import StudentFeatureForm from '../components/StudentFeatureForm';
import StudentReport from '../components/StudentReport';

function badgeClass(predictedClass) {
  if (predictedClass === 'Pass') return 'badge-pass';
  if (predictedClass === 'At-Risk') return 'badge-risk';
  if (predictedClass === 'Fail') return 'badge-fail';
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
      <div className="page-header">
        <h1>Welcome, {auth?.name}</h1>
        <p>Review and update each student's academic record and AI-usage profile, then generate their explainable report.</p>
      </div>

      {error && <div className="info-box error section">{error}</div>}

      {!students ? (
        <LoadingSpinner text="Loading your class..." />
      ) : (
        <>
          <div className="grid-3 section">
            <div className="accent-metric gsap-fade">
              <div className="metric-label">Total Students</div>
              <div className="metric-value">{total}</div>
            </div>
            <div className="accent-metric gsap-fade" style={{ borderLeftColor: '#059669' }}>
              <div className="metric-label">Pass</div>
              <div className="metric-value" style={{ color: '#059669' }}>{pass}</div>
            </div>
            <div className="accent-metric gsap-fade" style={{ borderLeftColor: '#D97706' }}>
              <div className="metric-label">At-Risk</div>
              <div className="metric-value" style={{ color: '#D97706' }}>{atRisk}</div>
            </div>
            <div className="accent-metric gsap-fade" style={{ borderLeftColor: '#DC2626' }}>
              <div className="metric-label">Fail</div>
              <div className="metric-value" style={{ color: '#DC2626' }}>{fail}</div>
            </div>
            <div className="accent-metric gsap-fade" style={{ borderLeftColor: '#9CA3AF' }}>
              <div className="metric-label">Not Yet Assessed</div>
              <div className="metric-value" style={{ color: '#9CA3AF' }}>{notAssessed}</div>
            </div>
          </div>

          {total === 0 ? (
            <GlassCard className="section gsap-fade">
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div className="empty-state-icon" style={{ fontSize: '3.5rem', marginBottom: 12 }}>👩‍🏫</div>
                <h3 style={{ marginBottom: 8 }}>No students yet</h3>
                <p style={{ color: 'var(--color-text-muted)', maxWidth: 460, margin: '0 auto' }}>
                  Ask your students to sign up and select <strong>{auth?.name}</strong> as their teacher.
                  They’ll appear here automatically, and you can then fill in their profile and generate a report.
                </p>
              </div>
            </GlassCard>
          ) : (
          <GlassCard title="My Students" className="section gsap-fade">
            <div className="data-table-wrap">
              <table className="data-table">
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
                    <tr key={s.id} className="student-row">
                      <td>{i + 1}</td>
                      <td>{s.name}</td>
                      <td><code>{s.username}</code></td>
                      <td>
                        {s.latest_class ? (
                          <span className={`badge ${badgeClass(s.latest_class)}`}>{s.latest_class}</span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Not assessed</span>
                        )}
                      </td>
                      <td>{s.latest_confidence != null ? `${s.latest_confidence}%` : '—'}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        {s.last_updated ? new Date(s.last_updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <button
                          className="btn"
                          onClick={() => openStudent(s.id, s.name)}
                          style={{
                            padding: '6px 14px', fontSize: '0.8125rem', fontWeight: 700,
                            background: 'var(--color-border-light)', color: 'var(--color-primary-deep)',
                            boxShadow: 'none',
                          }}
                        >
                          Edit & Generate Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
          )}
        </>
      )}

      {activeId && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>×</button>
            <div className="page-header" style={{ marginBottom: 16 }}>
              <h2 style={{ marginBottom: 4 }}>{studentName}</h2>
              <p>Update the student's profile, then generate an explainable Combined-model report.</p>
            </div>

            {modalLoading && <LoadingSpinner text="Loading student profile..." />}
            {modalError && <div className="info-box error" style={{ marginBottom: 16 }}>{modalError}</div>}

            {form && !modalLoading && (
              <>
                <StudentFeatureForm form={form} update={update} />
                <button
                  className="btn btn-primary"
                  onClick={handleSaveAndGenerate}
                  disabled={saving}
                  style={{ width: '100%', marginBottom: 24, padding: '14px 24px' }}
                >
                  {saving ? 'Saving & Generating...' : '💾 Save & Generate Report'}
                </button>
              </>
            )}

            {report && (
              <>
                <div className="divider" />
                <h3 className="section-title">Generated Report</h3>
                <StudentReport formData={report.formData} result={report.result} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
