import { NavLink } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const links = [
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
    to: '/eda',
    label: 'Data Insights',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" />
        <path d="M17.5 14v7M14 17.5h7" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    to: '/models',
    label: 'Model Bench',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" />
        <path d="M7 16l4-6 4 4 5-8" stroke="url(#sidebar-grad)" strokeWidth="2" />
        <circle cx="7" cy="16" r="1.5" fill="currentColor" />
        <circle cx="11" cy="10" r="1.5" fill="currentColor" />
        <circle cx="15" cy="14" r="1.5" fill="currentColor" />
        <circle cx="20" cy="6" r="1.5" fill="currentColor" />
        <defs><linearGradient id="sidebar-grad" x1="7" y1="6" x2="20" y2="16"><stop stopColor="#A78BFA" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient></defs>
      </svg>
    ),
  },
  {
    to: '/explainability',
    label: 'Explainability',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" stroke="currentColor" />
        <path d="M12 8a2.5 2.5 0 0 1 1.8 4.2c-.5.6-1.3 1-1.8 1.6V15" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="17.5" r="0.5" fill="currentColor" stroke="currentColor" />
        <path d="M5.5 5.5l2 2M16.5 16.5l2 2M18.5 5.5l-2 2M5.5 18.5l2-2" stroke="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    to: '/bias',
    label: 'Fairness Lab',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" stroke="currentColor" strokeWidth="2" />
        <path d="M3 7h18" stroke="currentColor" />
        <path d="M6 7l-2 8c0 1.1 1.3 2 3 2s3-.9 3-2L8 7" stroke="currentColor" />
        <path d="M16 7l-2 8c0 1.1 1.3 2 3 2s3-.9 3-2l-2-8" stroke="currentColor" />
        <circle cx="12" cy="3" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/predict',
    label: 'Live Prediction',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L4.1 13.4a1 1 0 0 0 .8 1.6H11l-1 7 8.9-11.4a1 1 0 0 0-.8-1.6H13l0-7z" stroke="currentColor" fill="url(#bolt-grad)" fillOpacity="0.15" strokeWidth="1.8" />
        <defs><linearGradient id="bolt-grad" x1="8" y1="2" x2="16" y2="22"><stop stopColor="#A78BFA" /><stop offset="1" stopColor="#6D28D9" /></linearGradient></defs>
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

export default function Sidebar() {
  const navRef = useRef(null);

  useEffect(() => {
    if (!navRef.current) return;
    const items = navRef.current.querySelectorAll('.sidebar-link');
    gsap.fromTo(
      items,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out', delay: 0.2 }
    );
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="url(#brand-grad)" strokeWidth="2" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" stroke="#A78BFA" />
            <circle cx="12" cy="10" r="1.2" fill="#A78BFA" />
            <defs><linearGradient id="brand-grad" x1="2" y1="5" x2="22" y2="16"><stop stopColor="#C4B5FD" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient></defs>
          </svg>
          Vidya Setu
        </h2>
        <p>Indian Student Success AI</p>
      </div>


      <nav className="sidebar-nav" ref={navRef}>
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
    </aside>
  );
}
