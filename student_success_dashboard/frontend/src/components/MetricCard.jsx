export default function MetricCard({ icon, label, value }) {
  return (
    <div className="metric-card animate-in">
      {icon && <div className="metric-icon">{icon}</div>}
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}
