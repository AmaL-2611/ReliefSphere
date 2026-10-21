import { useState, useEffect } from "react";
import { FaBuilding, FaHandsHelping, FaGift, FaUsers, FaTruck, FaClipboardList } from "react-icons/fa";
import StatCard from "../../components/admin/StatCard";
import API from "../../api/axios";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/admin/stats");
        setStats(res.data.stats);
      } catch (err) {
        setError("Failed to load dashboard statistics.");
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        Loading dashboard statistics…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Welcome Back, Administrator 👋</h2>

      <div className="dashboard-grid">
        <StatCard
          title="Pending Organizations"
          value={stats?.organizations?.pending ?? "—"}
          icon={<FaBuilding />}
          color="#3b82f6"
        />

        <StatCard
          title="Pending Volunteers"
          value={stats?.volunteers?.pending ?? "—"}
          icon={<FaHandsHelping />}
          color="#f59e0b"
        />

        <StatCard
          title="Total Donations"
          value={stats?.donations?.total ?? "—"}
          icon={<FaGift />}
          color="#10b981"
        />

        <StatCard
          title="Total Users"
          value={stats?.users?.total ?? "—"}
          icon={<FaUsers />}
          color="#8b5cf6"
        />

        <StatCard
          title="Deliveries Completed"
          value={stats?.deliveries?.completed ?? "—"}
          icon={<FaTruck />}
          color="#0891b2"
        />

        <StatCard
          title="Open Requirements"
          value={stats?.requirements?.open ?? "—"}
          icon={<FaClipboardList />}
          color="#ef4444"
        />
      </div>

      {/* Summary rows */}
      <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {/* Organizations */}
        <div style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
          <h4 style={{ marginBottom: 12, color: "#1e293b", fontWeight: 700 }}>Organizations</h4>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#64748b" }}>Verified</span>
            <strong style={{ color: "#10b981" }}>{stats?.organizations?.verified ?? "—"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#64748b" }}>Pending</span>
            <strong style={{ color: "#f59e0b" }}>{stats?.organizations?.pending ?? "—"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Rejected</span>
            <strong style={{ color: "#ef4444" }}>{stats?.organizations?.rejected ?? "—"}</strong>
          </div>
        </div>

        {/* Donations */}
        <div style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
          <h4 style={{ marginBottom: 12, color: "#1e293b", fontWeight: 700 }}>Donations</h4>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#64748b" }}>Pending</span>
            <strong style={{ color: "#f59e0b" }}>{stats?.donations?.pending ?? "—"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#64748b" }}>Matched / Accepted</span>
            <strong style={{ color: "#0891b2" }}>
              {stats != null ? (stats.donations.matched || 0) + (stats.donations.accepted || 0) : "—"}
            </strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Delivered</span>
            <strong style={{ color: "#10b981" }}>{stats?.donations?.delivered ?? "—"}</strong>
          </div>
        </div>

        {/* Deliveries */}
        <div style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
          <h4 style={{ marginBottom: 12, color: "#1e293b", fontWeight: 700 }}>Deliveries</h4>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#64748b" }}>Assigned</span>
            <strong style={{ color: "#f59e0b" }}>{stats?.deliveries?.assigned ?? "—"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#64748b" }}>In Transit</span>
            <strong style={{ color: "#0891b2" }}>{stats?.deliveries?.inTransit ?? "—"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Completed</span>
            <strong style={{ color: "#10b981" }}>{stats?.deliveries?.completed ?? "—"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
