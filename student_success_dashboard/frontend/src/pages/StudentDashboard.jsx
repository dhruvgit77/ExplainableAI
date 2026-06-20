import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import StudentReport from '../components/StudentReport';

export default function StudentDashboard() {
  const { auth } = useAuth();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    api.getMyReport().then(setReport).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!report || !containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelectorAll('.gsap-fade'),
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    );
  }, [report]);

  return (
    <div ref={containerRef}>
      <div className="page-header">
        <h1>Welcome, {auth?.name}</h1>
        <p>This is your latest performance report, generated and verified by your teacher.</p>
      </div>

      {error && <div className="info-box error section">{error}</div>}

      {!report && !error && <LoadingSpinner text="Loading your report..." />}

      {report && !report.has_report && (
        <GlassCard className="section gsap-fade">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="empty-state-icon" style={{ fontSize: '3.5rem', marginBottom: 12 }}>📭</div>
            <h3 style={{ marginBottom: 8 }}>No report yet</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Your teacher hasn't generated your report yet. Check back after your profile has been reviewed.
            </p>
          </div>
        </GlassCard>
      )}

      {report && report.has_report && (
        <div className="section gsap-fade">
          <StudentReport formData={report.profile_snapshot} result={report.result} />
        </div>
      )}
    </div>
  );
}
