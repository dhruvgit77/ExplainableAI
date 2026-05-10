export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="loading-container" style={{ animation: 'fadeInUp 0.5s ease both' }}>
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div className="spinner" style={{ width: 48, height: 48 }} />
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: 48, height: 48,
          border: '3px solid transparent',
          borderBottomColor: 'var(--color-primary-light)',
          borderRadius: '50%',
          animation: 'spin 1.2s cubic-bezier(0.4,0,0.2,1) infinite reverse',
        }} />
      </div>
      <span className="loading-text" style={{
        animation: 'fadeInUp 0.6s ease 0.2s both',
        background: 'linear-gradient(90deg, var(--color-text-primary), var(--color-primary))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        {text}
      </span>
    </div>
  );
}
