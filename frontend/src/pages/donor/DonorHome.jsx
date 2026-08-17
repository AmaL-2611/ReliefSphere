import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import StatsCard from "../../components/donor/StatsCard";
import RecentDonationTable from "../../components/donor/RecentDonationTable";

export default function DonorHome() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const donorName = user.fullName || "Donor";

  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0, pending: 0 });
  const [recentDonations, setRecentDonations] = useState([]);
  const [openRequirements, setOpenRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [donationsRes, reqsRes] = await Promise.all([
          API.get("/donations/my", { headers }).catch(() => ({ data: {} })),
          API.get("/requirements?status=open", { headers }).catch(() => ({ data: {} })),
        ]);

        const { donations = [], stats: s = {} } = donationsRes.data || {};
        setStats(s);
        setRecentDonations(
          donations.slice(0, 5).map((d) => ({
            id: d._id,
            name: d.donationName,
            type: d.category,
            quantity: d.quantity,
            date: new Date(d.createdAt).toLocaleDateString("en-IN"),
            status: d.status.charAt(0).toUpperCase() + d.status.slice(1).replace(/_/g, " "),
          }))
        );

        setOpenRequirements(reqsRes.data?.requirements?.slice(0, 4) || []);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Welcome back, {donorName.split(" ")[0]} 👋</h1>
        <p className="page-subtitle">
          Here's your live donation activity on ReliefSphere AI.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          icon="🎁"
          value={loading ? "…" : stats.total || 0}
          label="Total Donations"
          gradientStart="#10b981"
          gradientEnd="#34d399"
          iconBg="#d1fae5"
          trend="All time"
        />
        <StatsCard
          icon="⚡"
          value={loading ? "…" : stats.active || 0}
          label="Active Donations"
          gradientStart="#f59e0b"
          gradientEnd="#fbbf24"
          iconBg="#fef3c7"
          trend="In progress"
        />
        <StatsCard
          icon="✅"
          value={loading ? "…" : stats.delivered || 0}
          label="Delivered"
          gradientStart="#3b82f6"
          gradientEnd="#60a5fa"
          iconBg="#dbeafe"
          trend="Completed"
        />
        <StatsCard
          icon="⏳"
          value={loading ? "…" : stats.pending || 0}
          label="Pending Match"
          gradientStart="#8b5cf6"
          gradientEnd="#a78bfa"
          iconBg="#ede9fe"
          trend="Awaiting AI"
        />
      </div>

      {/* Quick Actions */}
      <div className="section-card" style={{ marginBottom: 28 }}>
        <div className="section-card-header">
          <div className="section-card-title">
            <span className="section-card-title-dot" />
            Quick Actions
          </div>
        </div>
        <div className="section-card-body" style={{ padding: "20px 24px", display: "flex", gap: 14, flexWrap: "wrap" }}>
          <button
            className="action-btn action-btn-view"
            id="quick-create-btn"
            onClick={() => navigate("/donor/create-donation")}
            style={{ padding: "10px 20px", fontSize: 14 }}
          >
            ➕ New Donation
          </button>
          <button
            className="action-btn"
            id="quick-browse-btn"
            onClick={() => navigate("/donor/browse-requirements")}
            style={{ padding: "10px 20px", fontSize: 14, background: "#ede9fe", color: "#6d28d9" }}
          >
            🔍 Browse NGO Requirements ({openRequirements.length})
          </button>
          <button
            className="action-btn"
            id="quick-my-donations-btn"
            onClick={() => navigate("/donor/my-donations")}
            style={{ padding: "10px 20px", fontSize: 14, background: "#eff6ff", color: "#2563eb" }}
          >
            📋 View All Donations
          </button>
          <button
            className="action-btn"
            id="quick-track-btn"
            onClick={() => navigate("/donor/track-donation")}
            style={{ padding: "10px 20px", fontSize: 14, background: "#fef3c7", color: "#d97706" }}
          >
            🗺 Track Donation
          </button>
        </div>
      </div>

      {/* Urgent NGO Resource Requests Section */}
      <div className="section-card" style={{ marginBottom: 28 }}>
        <div className="section-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="section-card-title">
            <span className="section-card-title-dot" style={{ background: "#ef4444" }} />
            Urgent NGO Resource Requests
          </div>
          <button
            onClick={() => navigate("/donor/browse-requirements")}
            style={{ background: "none", border: "none", color: "#0891b2", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            View All ({openRequirements.length}) ➔
          </button>
        </div>
        <div className="section-card-body" style={{ padding: "20px 24px" }}>
          {loading ? (
            <div style={{ textTransform: "none", color: "#64748b", padding: "16px 0" }}>Loading NGO requests…</div>
          ) : openRequirements.length === 0 ? (
            <div style={{ color: "#64748b", textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>📋</div>
              <p style={{ fontWeight: 600 }}>No open organization requests right now.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {openRequirements.map((req) => (
                <div
                  key={req._id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: 16,
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    justify: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{req.title}</div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: req.urgency === "critical" ? "#fef2f2" : "#fefce8",
                          color: req.urgency === "critical" ? "#dc2626" : "#ca8a04",
                          border: `1px solid ${req.urgency === "critical" ? "#fca5a5" : "#fde047"}`,
                        }}
                      >
                        {req.urgency}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                      🏢 {req.organizationId?.orgName || "Verified Organization"} • 📍 {req.location || "Local"}
                    </div>
                    <div style={{ fontSize: 13, color: "#475569", fontWeight: 600, marginBottom: 12 }}>
                      Needed: <span style={{ color: "#0891b2" }}>{req.quantity} {req.category}</span>
                    </div>
                  </div>
                  <button
                    className="action-btn action-btn-view"
                    style={{ width: "100%", padding: "8px 0", fontSize: 13, textAlign: "center" }}
                    onClick={() => navigate("/donor/create-donation")}
                  >
                    🎁 Fulfill / Donate Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Donations Table */}
      <RecentDonationTable donations={recentDonations} loading={loading} />
    </>
  );
}
