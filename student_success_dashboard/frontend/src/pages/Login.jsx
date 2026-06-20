import { useEffect, useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import gsap from 'gsap';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../components/ParticleBackground';
import LoadingSpinner from '../components/LoadingSpinner';

const FEATURES = [
  'Teachers enter and verify each student’s academic record and AI-usage profile — no self-reported numbers.',
  'One click generates a Combined-model prediction with full SHAP explanations.',
  'Students see their own report, read-only — the data behind their score can’t be edited by them.',
];

export default function Login() {
  const { auth, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [role, setRole] = useState('teacher');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pageRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!pageRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(pageRef.current.querySelector('.login-brand-panel'),
      { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.8 })
      .fromTo(pageRef.current.querySelectorAll('.login-feature-item'),
        { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.12 }, '-=0.4')
      .fromTo(pageRef.current.querySelector('.login-card'),
        { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7 }, '-=0.6');
  }, []);

  // Load teachers when a student is about to sign up.
  useEffect(() => {
    if (mode === 'signup' && role === 'student' && teachers.length === 0) {
      api.getTeachers().then(setTeachers).catch(() => {});
    }
  }, [mode, role, teachers.length]);

  function animateCard() {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0.4, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
  }

  function switchMode(next) {
    setMode(next);
    setError('');
    setPassword('');
    animateCard();
  }

  function pickRole(r) {
    setRole(r);
    setError('');
    setTeacherId('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const res = await api.login(username, password);
        if (res.role !== role) {
          setError(`That account is registered as a ${res.role}. Switch tabs above.`);
          setLoading(false);
          return;
        }
        login(res);
        navigate(res.role === 'teacher' ? '/teacher' : '/student', { replace: true });
      } else {
        const payload = {
          username, password, full_name: fullName, role,
          teacher_id: role === 'student' ? Number(teacherId) : null,
        };
        const res = await api.signup(payload);
        login(res);
        navigate(res.role === 'teacher' ? '/teacher' : '/student', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (auth) {
    return <Navigate to={auth.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }

  const isSignup = mode === 'signup';

  return (
    <div className="login-page" ref={pageRef}>
      <ParticleBackground />

      <div className="login-brand-panel">
        <div className="login-card-brand">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="#A5B4FC" strokeWidth="2" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" stroke="#818CF8" />
            <circle cx="12" cy="10" r="1.2" fill="#818CF8" />
          </svg>
          <strong style={{ fontSize: '1.35rem' }}>Vidya Setu</strong>
        </div>
        <h1>Explainable AI<br />for the AI era.</h1>
        <p>
          Predictions built on a verified academic record <b>and</b> a verified AI-usage profile —
          entered by the teacher who knows the student, not self-reported by the student being scored.
        </p>
        <div className="login-feature-list">
          {FEATURES.map((f, i) => (
            <div className="login-feature-item" key={i}>
              <span className="dot" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-card" ref={cardRef}>
          <div className="login-mode-switch">
            <button type="button" className={!isSignup ? 'active' : ''} onClick={() => switchMode('signin')}>Sign In</button>
            <button type="button" className={isSignup ? 'active' : ''} onClick={() => switchMode('signup')}>Sign Up</button>
          </div>

          <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
          <p className="login-subtitle">
            {isSignup ? 'Join Vidya Setu as a teacher or a student.' : 'Sign in to your Vidya Setu account.'}
          </p>

          <div className="login-role-tabs">
            <button type="button" className={`login-role-tab ${role === 'teacher' ? 'active' : ''}`} onClick={() => pickRole('teacher')}>
              🎓 Teacher
            </button>
            <button type="button" className={`login-role-tab ${role === 'student' ? 'active' : ''}`} onClick={() => pickRole('student')}>
              🎒 Student
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {isSignup && (
              <div className="login-input-group">
                <label htmlFor="fullName">Full Name</label>
                <input id="fullName" type="text" value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 'teacher' ? 'Mrs. Iyer' : 'Aarav Sharma'} required />
              </div>
            )}

            <div className="login-input-group">
              <label htmlFor="username">Username</label>
              <input id="username" type="text" autoComplete="username" value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'teacher' ? 'teacher1' : 'student01'} required />
            </div>

            <div className="login-input-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {isSignup && role === 'student' && (
              <div className="login-input-group">
                <label htmlFor="teacher">Your Teacher</label>
                <select id="teacher" className="login-select" value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)} required>
                  <option value="" disabled>Select your teacher…</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} (@{t.username})</option>
                  ))}
                </select>
                {teachers.length === 0 && (
                  <span className="login-hint-text">No teachers registered yet — ask your teacher to sign up first.</span>
                )}
              </div>
            )}

            {error && <div className="info-box error" style={{ marginBottom: 16 }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? (isSignup ? 'Creating account…' : 'Signing in…') : (isSignup ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {loading && <LoadingSpinner text={isSignup ? 'Setting things up…' : 'Verifying credentials…'} />}

          {!isSignup && (
            <div className="login-demo-hint">
              Demo — Teacher: <code>teacher1</code> / <code>teacher123</code><br />
              Student: <code>student01</code> / <code>student123</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
