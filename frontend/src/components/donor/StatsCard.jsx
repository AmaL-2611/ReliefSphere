export default function StatsCard({ icon, value, label, gradientStart, gradientEnd, iconBg, trend }) {
  return (
    <div
      className="stat-card"
      style={{
        "--card-gradient-start": gradientStart,
        "--card-gradient-end": gradientEnd,
        "--icon-bg": iconBg,
      }}
    >
      <div className="stat-card-top">
        <div className="stat-card-icon">{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {trend && <div className="stat-card-trend">↑ {trend}</div>}
    </div>
  );
}
