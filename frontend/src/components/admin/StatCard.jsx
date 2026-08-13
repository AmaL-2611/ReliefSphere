import "../../styles/admin/dashboard.css";

function StatCard({ title, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>

      <div>
        <h6>{title}</h6>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

export default StatCard;
