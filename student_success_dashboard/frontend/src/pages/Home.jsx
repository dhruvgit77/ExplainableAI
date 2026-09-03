import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import MetricCard from '../components/MetricCard';
import NewsFeed from '../components/NewsFeed';

const sections = [
  {
    to: '/teacher',
    label: 'My Students',
    value: 'Class Overview',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="var(--color-primary)" />
        <circle cx="10" cy="7" r="4" stroke="var(--color-primary)" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="var(--color-primary)" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="var(--color-primary)" />
      </svg>
    ),
  },
  {
    to: '/predict',
    label: 'Live Prediction',
    value: 'Predict a Student',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L4.1 13.4a1 1 0 0 0 .8 1.6H11l-1 7 8.9-11.4a1 1 0 0 0-.8-1.6H13l0-7z" stroke="var(--color-primary)" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    to: '/batch',
    label: 'Batch Upload',
    value: 'Score Entire Class',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="var(--color-primary)" />
        <polyline points="17 8 12 3 7 8" stroke="var(--color-primary)" />
        <line x1="12" y1="3" x2="12" y2="15" stroke="var(--color-primary)" />
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
          Explainable AI for the AI era. Vidya Setu predicts student outcomes from <b>traditional academic records</b>,
          <b> modern AI-usage behaviour</b>, and a third tier of <b>agentic features measured from the student's own work</b> —
          rewarding genuine AI-augmented learning and flagging blind copy-pasting.
        </p>

        <div className="grid-3" style={{ marginTop: 24 }}>
          <AnimatedStat value={38} label="Features (Traditional + AI + Agentic)" />
          <AnimatedStat value={3} label="Feature Tiers Fused" />
          <AnimatedStat value={87} label="Full Model Accuracy" suffix="%" />
        </div>
      </div>

      <div className="grid-3 section" ref={cardsRef}>
        {sections.map((s) => (
          <Link to={s.to} key={s.to} style={{ textDecoration: 'none' }}>
            <MetricCard icon={s.icon} label={s.label} value={s.value} />
          </Link>
        ))}
      </div>

      <NewsFeed />

      <div className="glass-card gsap-fade">
        <h3 style={{ marginBottom: 16 }}>About the Platform</h3>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, fontSize: 'var(--font-base)' }}>
          Vidya Setu predicts whether each student will <b>Pass, be At-Risk, or Fail</b> using a three-tier XGBoost model
          trained on 38 features: a <b>Traditional</b> tier (CGPA, attendance, marks, coaching, regional factors),
          a <b>Modern</b> tier of AI-usage behaviour (reliance, verification, assignment outsourcing, digital distraction),
          and an <b>Agentic</b> tier measured from the student's actual work (comprehension depth, code originality,
          cross-modal consistency, learning trajectory). Every prediction comes with <b>SHAP explanations</b> showing
          exactly which factors drove the result, and a <b>counterfactual plan</b> showing the minimum changes needed
          to flip the outcome to Pass.
        </p>
      </div>
    </div>
  );
}
