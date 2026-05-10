export default function GlassCard({ title, children, className = '' }) {
  return (
    <div className={`glass-card ${className}`}>
      {title && <div className="glass-card-title">{title}</div>}
      {children}
    </div>
  );
}
