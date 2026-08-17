import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

export default function VolHome() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const volName = user.fullName || "Volunteer";

  const [stats, setStats] = useState({ total: 0, assigned: 0, inTransit: 0, delivered: 0 });
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/deliveries/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data.stats || {});
        setDeliveries((res.data.deliveries || []).slice(0, 5));
      } catch (err) {
        console.error("Failed to load volunteer dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completionRate = stats.total > 0
    ? Math.round((stats.delivered / stats.total) * 100)
    : 100;

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>Hello, {volName} 👋</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Here is your humanitarian delivery task overview and assigned pickups.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="vol-stats-grid">
        <div className="vol-stat-card">
          <div className="vol-stat-accent" style={{ background: "linear-gradient(90deg, #4f46e5, #6366f1)" }} />
          <div className="vol-stat-value">{loading ? "…" : stats.assigned || 0}</div>
          <div className="vol-stat-label">Assigned Pickups</div>
        </div>

        <div className="vol-stat-card">
          <div className="vol-stat-accent" style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }} />
          <div className="vol-stat-value">{loading ? "…" : stats.inTransit || 0}</div>
          <div className="vol-stat-label">In Transit Deliveries</div>
        </div>

        <div className="vol-stat-card">
          <div className="vol-stat-accent" style={{ background: "linear-gradient(90deg, #10b981, #34d399)" }} />
          <div className="vol-stat-value">{loading ? "…" : stats.delivered || 0}</div>
          <div className="vol-stat-label">Completed Deliveries</div>
        </div>

        <div className="vol-stat-card">
          <div className="vol-stat-accent" style={{ background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }} />
          <div className="vol-stat-value">{loading ? "…" : `${completionRate}%`}</div>
          <div className="vol-stat-label">Delivery Success Rate</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="vol-card" style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", marginBottom: 16 }}>
          Quick Actions
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <button
            className="vol-btn-primary"
            id="vol-quick-deliveries"
            onClick={() => navigate("/volunteer/assigned-deliveries")}
          >
            📦 Manage Assigned Deliveries ({stats.assigned + stats.inTransit})
          </button>
          <button
            className="vol-btn-secondary"
            id="vol-quick-completed"
            onClick={() => navigate("/volunteer/completed-deliveries")}
          >
            ✅ View Completed History ({stats.delivered})
          </button>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="vol-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>Active Deliveries</div>
          <button
            className="vol-btn-secondary"
            style={{ padding: "6px 14px", fontSize: 13 }}
            onClick={() => navigate("/volunteer/assigned-deliveries")}
          >
            View All →
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>Loading deliveries…</div>
        ) : deliveries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>
            <p>No active deliveries assigned currently.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {deliveries.map((del) => (
              <div
                key={del._id}
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: 16,
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
                    {del.donationId?.donationName || "Relief Supply Donation"}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    📍 <strong>Pickup:</strong> {del.pickupAddress} → <strong>Drop:</strong> {del.dropAddress}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      background: del.status === "delivered" ? "#d1fae5" : del.status === "picked_up" ? "#fef3c7" : "#e0e7ff",
                      color: del.status === "delivered" ? "#047857" : del.status === "picked_up" ? "#b45309" : "#4338ca",
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}
                  >
                    {del.status?.replace(/_/g, " ")}
                  </span>
                  <button
                    className="vol-btn-primary"
                    style={{ padding: "6px 14px", fontSize: 13 }}
                    onClick={() => navigate("/volunteer/assigned-deliveries")}
                  >
                    Open Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
