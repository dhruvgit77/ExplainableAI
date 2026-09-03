import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import rvceLogo from '../assets/rvce-logo.png';

const teacherLinks = [
  {
    to: '/teacher',
    label: 'My Students',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" />
        <circle cx="10" cy="7" r="4" stroke="currentColor" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" />
      </svg>
    ),
  },
  {
    to: '/',
    label: 'Overview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 22V12h6v10" stroke="currentColor" />
        <path d="M2 10.5 12 3l10 7.5" stroke="currentColor" strokeWidth="2" />
        <path d="M4 9.5V21a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5" stroke="currentColor" />
      </svg>
    ),
  },
  {
    to: '/predict',
    label: 'Live Prediction',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L4.1 13.4a1 1 0 0 0 .8 1.6H11l-1 7 8.9-11.4a1 1 0 0 0-.8-1.6H13l0-7z" stroke="currentColor" fill="url(#bolt-grad)" fillOpacity="0.15" strokeWidth="1.8" />
        <defs><linearGradient id="bolt-grad" x1="8" y1="2" x2="16" y2="22"><stop stopColor="#D4D4D8" /><stop offset="1" stopColor="#27272A" /></linearGradient></defs>
      </svg>
    ),
  },
  {
    to: '/batch',
    label: 'Batch Upload',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" />
        <polyline points="17 8 12 3 7 8" stroke="currentColor" />
        <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" />
      </svg>
    ),
  },
];

const studentLinks = [
  {
    to: '/student',
    label: 'My Report',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" />
        <polyline points="14 2 14 8 20 8" stroke="currentColor" />
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" />
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, logout } = useAuth();
  const links = auth?.role === 'student' ? studentLinks : teacherLinks;

  useEffect(() => {
    if (!navRef.current) return;
    const items = navRef.current.querySelectorAll('.sidebar-link');
    gsap.fromTo(
      items,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out', delay: 0.2 }
    );
  }, [auth?.role]);

  // Slide the glowing indicator behind the active link as the route changes.
  useEffect(() => {
    const moveIndicator = () => {
      if (!navRef.current || !indicatorRef.current) return;
      const activeEl = navRef.current.querySelector('.sidebar-link.active');
      if (!activeEl) {
        gsap.to(indicatorRef.current, { opacity: 0, duration: 0.2 });
        return;
      }
      const { offsetTop, offsetHeight } = activeEl;
      gsap.to(indicatorRef.current, {
        y: offsetTop, height: offsetHeight, opacity: 1,
        duration: 0.45, ease: 'power3.inOut',
      });
    };
    const raf = requestAnimationFrame(moveIndicator);
    window.addEventListener('resize', moveIndicator);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', moveIndicator);
    };
  }, [location.pathname, auth?.role]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="url(#brand-grad)" strokeWidth="2" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" stroke="#D4D4D8" />
            <circle cx="12" cy="10" r="1.2" fill="#D4D4D8" />
            <defs><linearGradient id="brand-grad" x1="2" y1="5" x2="22" y2="16"><stop stopColor="#FFFFFF" /><stop offset="1" stopColor="#A1A1AA" /></linearGradient></defs>
          </svg>
          Vidya Setu
        </h2>
        <p>Indian Student Success AI</p>
        <div className="sidebar-college-badge">
          <img src={rvceLogo} alt="RV College of Engineering logo" />
          <span>RV College of Engineering<br />Bengaluru</span>
        </div>
      </div>

      {auth && (
        <div className="sidebar-profile">
          <div className="profile-avatar">{auth.name?.[0]?.toUpperCase() || '?'}</div>
          <div className="profile-info">
            <span className="profile-name">{auth.name}</span>
            <span className="profile-role">{auth.role === 'teacher' ? 'Teacher' : 'Student'}</span>
          </div>
        </div>
      )}

      <nav className="sidebar-nav" ref={navRef}>
        <div className="sidebar-active-pill" ref={indicatorRef} />
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log Out
        </button>
      </div>
    </aside>
  );
}
