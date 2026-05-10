import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import MetricCard from '../components/MetricCard';

const sections = [
  {
    to: '/eda',
    label: 'Data Insights',
    value: 'Explore Patterns',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="var(--color-primary)" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="var(--color-primary)" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="var(--color-primary)" />
        <path d="M17.5 14v7M14 17.5h7" stroke="var(--color-primary)" strokeWidth="2" />
      </svg>
    ),
  },
  {
    to: '/models',
    label: 'Model Bench',
    value: 'Compare Classifiers',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" stroke="var(--color-primary)" strokeWidth="2" />
        <path d="M7 16l4-6 4 4 5-8" stroke="var(--color-primary-light)" strokeWidth="2" />
        <circle cx="7" cy="16" r="1.5" fill="var(--color-primary)" />
        <circle cx="11" cy="10" r="1.5" fill="var(--color-primary)" />
        <circle cx="15" cy="14" r="1.5" fill="var(--color-primary)" />
        <circle cx="20" cy="6" r="1.5" fill="var(--color-primary)" />
      </svg>
    ),
  },
  {
    to: '/explainability',
    label: 'XAI Engine',
    value: 'SHAP & LIME',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" stroke="var(--color-primary)" />
        <path d="M12 8a2.5 2.5 0 0 1 1.8 4.2c-.5.6-1.3 1-1.8 1.6V15" stroke="var(--color-primary)" strokeWidth="2" />
        <circle cx="12" cy="17.5" r="0.5" fill="var(--color-primary)" stroke="var(--color-primary)" />
      </svg>
    ),
  },
  {
    to: '/bias',
    label: 'Fairness Audit',
    value: 'Equity Check',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" stroke="var(--color-primary)" strokeWidth="2" />
        <path d="M3 7h18" stroke="var(--color-primary)" />
        <path d="M6 7l-2 8c0 1.1 1.3 2 3 2s3-.9 3-2L8 7" stroke="var(--color-primary)" />
        <path d="M16 7l-2 8c0 1.1 1.3 2 3 2s3-.9 3-2l-2-8" stroke="var(--color-primary)" />
      </svg>
    ),
  },
];

/* Animated counter */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

function AnimatedStat({ value, label, suffix = '', className = '' }) {
  const count = useCountUp(value);
  return (
    <div className={`accent-metric hero-stat ${className}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{count.toLocaleString()}{suffix}</div>
    </div>
  );
}

export default function Home() {
  const heroRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    if (!heroRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(
      heroRef.current.querySelector('.hero-title'),
      { opacity: 0, y: 60, clipPath: 'inset(100% 0 0 0)' },
      { opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)', duration: 1 }
    )
      .fromTo(
        heroRef.current.querySelector('.hero-subtitle'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.4'
      )
      .fromTo(
        heroRef.current.querySelectorAll('.hero-stat'),
        { opacity: 0, y: 25, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12 },
        '-=0.3'
      );
  }, []);

  useEffect(() => {
    if (!cardsRef.current) return;
    gsap.fromTo(
      cardsRef.current.querySelectorAll('.metric-card'),
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.8 }
    );
  }, []);

  return (
    <div>
      <div className="hero" ref={heroRef}>
        <h1 className="hero-title">
          🇮🇳 Vidya Setu — Indian Student Success Platform
        </h1>
        <p className="hero-subtitle">
          Explainable AI for Indian Education. Predict student outcomes across CBSE, ICSE, and State Board systems
          with transparent, interpretable ML models and fairness auditing.
        </p>

        <div className="grid-3" style={{ marginTop: 24 }}>
          <AnimatedStat value={5000} label="Students Analyzed" />
          <AnimatedStat value={4} label="ML Models Compared" />
          <AnimatedStat value={97} label="Best Accuracy" suffix="%" />
        </div>
      </div>

      <div className="grid-4 section" ref={cardsRef}>
        {sections.map((s) => (
          <Link to={s.to} key={s.to} style={{ textDecoration: 'none' }}>
            <MetricCard icon={s.icon} label={s.label} value={s.value} />
          </Link>
        ))}
      </div>

      <div className="glass-card gsap-fade">
        <h3 style={{ marginBottom: 16 }}>About the Platform</h3>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, fontSize: 'var(--font-base)' }}>
          Vidya Setu leverages state-of-the-art Machine Learning models trained on Indian academic indicators —
          including CGPA (UGC 10-point scale), board type (CBSE/ICSE/State/IB), coaching enrollment, medium of instruction,
          and regional socioeconomic factors. It provides transparent SHAP and LIME explanations to help educators
          identify at-risk students early, while auditing for bias across gender, region, and board type.
        </p>
      </div>
    </div>
  );
}
