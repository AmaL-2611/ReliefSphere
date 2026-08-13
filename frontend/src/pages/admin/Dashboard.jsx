import { FaBuilding, FaHandsHelping, FaGift, FaUsers } from "react-icons/fa";

import StatCard from "../../components/admin/StatCard";

function Dashboard() {
  return (
    <div>
      <h2 className="mb-4">Welcome Back, Administrator 👋</h2>

      <div className="dashboard-grid">
        <StatCard
          title="Pending Organizations"
          value="12"
          icon={<FaBuilding />}
          color="#3b82f6"
        />

        <StatCard
          title="Pending Volunteers"
          value="8"
          icon={<FaHandsHelping />}
          color="#f59e0b"
        />

        <StatCard
          title="Total Donations"
          value="156"
          icon={<FaGift />}
          color="#10b981"
        />

        <StatCard
          title="Total Users"
          value="210"
          icon={<FaUsers />}
          color="#8b5cf6"
        />
      </div>
    </div>
  );
}

export default Dashboard;
