import { useEffect, useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import gsap from 'gsap';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../components/ParticleBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import rvceLogo from '../assets/rvce-logo.png';

const FEATURES = [
  { icon: '🧾', text: 'Teachers enter and verify each student’s academic record and AI-usage profile — no self-reported numbers.' },
  { icon: '🔍', text: 'One click generates a Full three-tier model prediction with full SHAP explanations.' },
  { icon: '🔒', text: 'Students see their own report, read-only — the data behind their score can’t be edited by them.' },
];

export default function Login() {
  const { auth, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [role, setRole] = useState('teacher');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pageRef = useRef(null);
  const cardRef = useRef(null);
  const modeIndicatorRef = useRef(null);
  const roleIndicatorRef = useRef(null);
  const modeSwitchRef = useRef(null);
  const roleSwitchRef = useRef(null);

  useEffect(() => {
    if (!pageRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(pageRef.current.querySelector('.auth-brand-panel'),
      { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.8 })
      .fromTo(pageRef.current.querySelectorAll('.auth-feature-item'),
        { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.12 }, '-=0.4')
      .fromTo(pageRef.current.querySelector('.auth-card'),
        { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7 }, '-=0.6');
  }, []);

  // Slide the pill indicators to match current mode / role.
  useEffect(() => {
    moveIndicator(modeSwitchRef, modeIndicatorRef, mode === 'signin' ? 0 : 1);
  }, [mode]);

  useEffect(() => {
    moveIndicator(roleSwitchRef, roleIndicatorRef, role === 'teacher' ? 0 : 1);
  }, [role]);

  function moveIndicator(switchRef, indicatorRef, index) {
    if (!switchRef.current || !indicatorRef.current) return;
    const buttons = switchRef.current.querySelectorAll('button');
    const target = buttons[index];
    if (!target) return;
    const { offsetLeft, offsetWidth } = target;
    gsap.to(indicatorRef.current, {
      x: offsetLeft - 4, width: offsetWidth,
      duration: 0.4, ease: 'power3.inOut',
    });
  }

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
    <div className="auth-page" ref={pageRef}>
      <ParticleBackground />
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-brand-panel">
        <div className="auth-college-credit">
          <img src={rvceLogo} alt="RV College of Engineering logo" />
          <div className="auth-college-credit-text">
            <strong>RV College of Engineering</strong>
            <span>Bengaluru · Built by students</span>
          </div>
        </div>
        <div className="auth-brand-mark">
          <div className="auth-brand-orbit">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="#FFFFFF" strokeWidth="2" />
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" stroke="#D4D4D8" />
              <circle cx="12" cy="10" r="1.2" fill="#D4D4D8" />
            </svg>
          </div>
          <strong>Vidya Setu</strong>
        </div>
        <h1 className="auth-headline">Explainable AI<br />for the AI era.</h1>
        <p className="auth-subtext">
          Predictions built on a verified academic record <b>and</b> a verified AI-usage profile —
          entered by the teacher who knows the student, not self-reported by the student being scored.
        </p>
        <div className="auth-feature-list">
          {FEATURES.map((f, i) => (
            <div className="auth-feature-item" key={i}>
              <span className="auth-feature-icon">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card" ref={cardRef}>
          <div className="auth-pill-switch" ref={modeSwitchRef}>
            <div className="auth-pill-indicator" ref={modeIndicatorRef} />
            <button type="button" className={!isSignup ? 'active' : ''} onClick={() => switchMode('signin')}>Sign In</button>
            <button type="button" className={isSignup ? 'active' : ''} onClick={() => switchMode('signup')}>Sign Up</button>
          </div>

          <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
          <p className="auth-subtitle">
            {isSignup ? 'Join Vidya Setu as a teacher or a student.' : 'Sign in to your Vidya Setu account.'}
          </p>

          <div className="auth-pill-switch" ref={roleSwitchRef}>
            <div className="auth-pill-indicator" ref={roleIndicatorRef} />
            <button type="button" className={role === 'teacher' ? 'active' : ''} onClick={() => pickRole('teacher')}>
              🎓 Teacher
            </button>
            <button type="button" className={role === 'student' ? 'active' : ''} onClick={() => pickRole('student')}>
              🎒 Student
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {isSignup && (
              <div className="auth-input-group">
                <label htmlFor="fullName">Full Name</label>
                <input id="fullName" type="text" value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 'teacher' ? 'Mrs. Iyer' : 'Aarav Sharma'} required />
              </div>
            )}

            <div className="auth-input-group">
              <label htmlFor="username">Username</label>
              <input id="username" type="text" autoComplete="username" value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'teacher' ? 'teacher1' : 'student01'} required />
            </div>

            <div className="auth-input-group">
              <label htmlFor="password">Password</label>
              <input id="password" type={showPassword ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.5 5.4A10.4 10.4 0 0112 5c5 0 9 4 10 7-0.4 1.2-1.2 2.6-2.4 3.9M6.5 6.7C4.7 8 3.4 9.8 2 12c1 3 5 7 10 7 1.3 0 2.5-.2 3.6-.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {isSignup && role === 'student' && (
              <div className="auth-input-group">
                <label htmlFor="teacher">Your Teacher</label>
                <select id="teacher" value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)} required>
                  <option value="" disabled>Select your teacher…</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} (@{t.username})</option>
                  ))}
                </select>
                {teachers.length === 0 && (
                  <span className="auth-hint-text">No teachers registered yet — ask your teacher to sign up first.</span>
                )}
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (isSignup ? 'Creating account…' : 'Signing in…') : (isSignup ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {loading && <LoadingSpinner text={isSignup ? 'Setting things up…' : 'Verifying credentials…'} />}

          {!isSignup && (
            <div className="auth-demo-hint">
              Demo — Teacher: <code>teacher1</code> / <code>teacher123</code><br />
              Student: <code>student01</code> / <code>student123</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
