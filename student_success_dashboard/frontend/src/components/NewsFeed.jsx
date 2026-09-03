import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { api } from '../api/client';

const REFRESH_MS = 5 * 60 * 1000; // auto-refresh every 5 minutes

const CATEGORIES = [
  {
    key: 'wellbeing',
    label: 'Mental & Physical Health',
    match: /mental health|anxiety|stress|burnout|depression|sleep|wellbeing|well-being|suicide|therapy/i,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    ),
  },
  {
    key: 'digital',
    label: 'Digital Habits',
    match: /screen time|smartphone|social media|doomscroll|scrolling|phone addiction|digital detox/i,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="2" width="12" height="20" rx="2.5" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </svg>
    ),
  },
  {
    key: 'ai',
    label: 'AI & Tech',
    match: /\bai\b|artificial intelligence|chatgpt|machine learning|generative ai|llm/i,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="7" width="10" height="10" rx="2" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.6 4.6l2 2M17.4 4.6l-2 2M4.6 19.4l2-2M17.4 19.4l-2-2" />
      </svg>
    ),
  },
  {
    key: 'education',
    label: 'Education News',
    match: /.*/,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
      </svg>
    ),
  },
];

function categorize(title) {
  return CATEGORIES.find((c) => c.match.test(title)) || CATEGORIES[CATEGORIES.length - 1];
}

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NewsCardSkeleton({ i }) {
  return (
    <div className="news-card news-card-skeleton" style={{ animationDelay: `${i * 60}ms` }}>
      <div className="news-card-media news-skeleton-block" />
      <div className="news-card-body">
        <div className="news-skeleton-line" style={{ width: '90%' }} />
        <div className="news-skeleton-line" style={{ width: '65%' }} />
        <div className="news-skeleton-line news-skeleton-line-sm" style={{ width: '40%' }} />
      </div>
    </div>
  );
}

export default function NewsFeed() {
  const [articles, setArticles] = useState(null);
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const gridRef = useRef(null);

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getNews();
      setArticles(data.articles || []);
      setFetchedAt(data.fetched_at ? data.fetched_at * 1000 : Date.now());
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load live headlines right now.');
    } finally {
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!articles || !gridRef.current) return;
    gsap.fromTo(
      gridRef.current.querySelectorAll('.news-card'),
      { opacity: 0, y: 28, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out' }
    );
  }, [articles]);

  return (
    <div className="news-section section">
      <div className="news-section-header">
        <div>
          <div className="dash-hero-eyebrow"><span className="dot" /> Campus Pulse · Live</div>
          <h3 className="section-title" style={{ marginBottom: 4 }}>AI Usage &amp; Student Wellbeing — In the News</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Real-time headlines on AI in education, screen habits, and student mental &amp; physical health — refreshed automatically.
          </p>
        </div>
        <button
          type="button"
          className="news-refresh-btn"
          onClick={() => load(true)}
          disabled={refreshing}
          aria-label="Refresh headlines"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'spinning' : ''}>
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && !articles?.length && (
        <div className="info-box warning">{error} — headlines will retry automatically.</div>
      )}

      <div className="news-grid" ref={gridRef}>
        {!articles && Array.from({ length: 8 }).map((_, i) => <NewsCardSkeleton key={i} i={i} />)}

        {articles && articles.map((a, i) => {
          const cat = categorize(a.title);
          return (
            <a
              key={a.link + i}
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
              className="news-card"
            >
              <div className={`news-card-media news-media-${cat.key}`}>
                <span className="news-category-tag">{cat.icon}{cat.label}</span>
              </div>
              <div className="news-card-body">
                <h4 className="news-card-title">{a.title}</h4>
                <div className="news-source-row">
                  <span className="news-source">{a.source}</span>
                  <span className="news-dot">•</span>
                  <span className="news-time">{timeAgo(a.published_at)}</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {fetchedAt && (
        <p className="news-updated-at">Last updated {timeAgo(new Date(fetchedAt).toISOString())} · Source: Google News</p>
      )}
    </div>
  );
}
