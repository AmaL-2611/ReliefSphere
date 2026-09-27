import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

const URGENCY_BADGES = {
  critical: "org-badge-urgent-critical",
  high: "org-badge-urgent-high",
  medium: "org-badge-urgent-medium",
  low: "org-badge-urgent-low",
};

export default function OrgHome() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const orgName = user.fullName || "Organization";

  const [stats, setStats] = useState({ total: 0, open: 0, matched: 0, fulfilled: 0 });
  const [campaignStats, setCampaignStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalDonationsReceived: 0,
  });
  const [isCampaignEligible, setIsCampaignEligible] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [incomingCount, setIncomingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Get requirements stats
        const reqRes = await API.get("/requirements/org/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(reqRes.data.stats || {});
        setRequirements((reqRes.data.requirements || []).slice(0, 5));

        // Get incoming matched donations count
        const donRes = await API.get("/donations/org/incoming", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const incoming = (donRes.data.donations || []).filter((d) => d.status === "matched");
        setIncomingCount(incoming.length);

        // Fetch Campaign stats for eligible orgs (NGO & Community Shelter)
        try {
          const campRes = await API.get("/campaigns/org-stats", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (campRes.data.success) {
            setCampaignStats(campRes.data.stats || {});
            const orgType = campRes.data.orgType;
            if (orgType === "community_shelter") {
              setIsCampaignEligible(true);
            }
          }
        } catch (e) {
          // Ignore error if org is not eligible for campaigns
        }
      } catch (err) {
        console.error("Failed to load organization dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate trust score
  const trustScore =
    stats.total > 0
      ? Math.round(((stats.fulfilled + stats.matched) / stats.total) * 100)
      : 95;

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>Welcome, {orgName} 👋</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Manage your resource requirements and public fundraising campaigns.
        </p>
      </div>

      {/* Requirements Stats Grid */}
      <div className="org-stats-grid" style={{ marginBottom: 24 }}>
        <div className="org-stat-card">
          <div className="org-stat-accent" style={{ background: "linear-gradient(90deg, #0891b2, #06b6d4)" }} />
          <div className="org-stat-top">
            <div className="org-stat-icon" style={{ background: "#cffaff", color: "#0891b2" }}>📋</div>
          </div>
          <div className="org-stat-value">{loading ? "…" : stats.open || 0}</div>
          <div className="org-stat-label">Active Open Requirements</div>
        </div>

        <div className="org-stat-card">
          <div className="org-stat-accent" style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }} />
          <div className="org-stat-top">
            <div className="org-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>🎁</div>
          </div>
          <div className="org-stat-value">{loading ? "…" : incomingCount}</div>
          <div className="org-stat-label">Incoming Matched Allocations</div>
        </div>

        <div className="org-stat-card">
          <div className="org-stat-accent" style={{ background: "linear-gradient(90deg, #10b981, #34d399)" }} />
          <div className="org-stat-top">
            <div className="org-stat-icon" style={{ background: "#d1fae5", color: "#059669" }}>✅</div>
          </div>
          <div className="org-stat-value">{loading ? "…" : stats.fulfilled || 0}</div>
          <div className="org-stat-label">Fulfilled Requirements</div>
        </div>

        <div className="org-stat-card">
          <div className="org-stat-accent" style={{ background: "linear-gradient(90deg, #6366f1, #818cf8)" }} />
          <div className="org-stat-top">
            <div className="org-stat-icon" style={{ background: "#e0e7ff", color: "#4f46e5" }}>⭐</div>
          </div>
          <div className="org-stat-value">{loading ? "…" : `${trustScore}%`}</div>
          <div className="org-stat-label">Platform Trust Score</div>
        </div>
      </div>

      {/* Campaign Stats Grid (For NGO & Community Shelter) */}
      {isCampaignEligible && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🚀 Campaign Metrics</span>
          </div>
          <div className="org-stats-grid">
            <div className="org-stat-card">
              <div className="org-stat-accent" style={{ background: "linear-gradient(90deg, #10b981, #059669)" }} />
              <div className="org-stat-top">
                <div className="org-stat-icon" style={{ background: "#d1fae5", color: "#047857" }}>📢</div>
              </div>
              <div className="org-stat-value">{loading ? "…" : campaignStats.totalCampaigns || 0}</div>
              <div className="org-stat-label">Total Campaigns</div>
            </div>

            <div className="org-stat-card">
              <div className="org-stat-accent" style={{ background: "linear-gradient(90deg, #0284c7, #38bdf8)" }} />
              <div className="org-stat-top">
                <div className="org-stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>⚡</div>
              </div>
              <div className="org-stat-value">{loading ? "…" : campaignStats.activeCampaigns || 0}</div>
              <div className="org-stat-label">Active Campaigns</div>
            </div>

            <div className="org-stat-card">
              <div className="org-stat-accent" style={{ background: "linear-gradient(90deg, #8b5cf6, #a78bfa)" }} />
              <div className="org-stat-top">
                <div className="org-stat-icon" style={{ background: "#f3e8ff", color: "#7c3aed" }}>🏆</div>
              </div>
              <div className="org-stat-value">{loading ? "…" : campaignStats.completedCampaigns || 0}</div>
              <div className="org-stat-label">Completed Campaigns</div>
            </div>

            <div className="org-stat-card">
              <div className="org-stat-accent" style={{ background: "linear-gradient(90deg, #ec4899, #f472b6)" }} />
              <div className="org-stat-top">
                <div className="org-stat-icon" style={{ background: "#fce7f3", color: "#db2777" }}>🎁</div>
              </div>
              <div className="org-stat-value">{loading ? "…" : campaignStats.totalDonationsReceived || 0}</div>
              <div className="org-stat-label">Total Donations Received</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="org-card" style={{ marginBottom: 28 }}>
        <div className="org-card-header">
          <div className="org-card-title">
            <span className="org-card-title-dot" />
            Quick Actions
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <button
            className="org-btn-primary"
            id="org-quick-post"
            onClick={() => navigate("/organization/create-requirement")}
          >
            ➕ Post Requirement
          </button>

          {isCampaignEligible && (
            <button
              className="org-btn-primary"
              id="org-quick-create-campaign"
              onClick={() => navigate("/organization/create-campaign")}
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              🚀 Create Campaign
            </button>
          )}

          <button
            className="org-btn-secondary"
            id="org-quick-incoming"
            onClick={() => navigate("/organization/incoming-donations")}
            style={{ background: "#ecfeff", color: "#0891b2", borderColor: "#a5f3fc" }}
          >
            🎁 View Incoming Matches ({incomingCount})
          </button>
          <button
            className="org-btn-secondary"
            id="org-quick-my-reqs"
            onClick={() => navigate("/organization/my-requirements")}
          >
            📋 Manage Requirements ({stats.total || 0})
          </button>
        </div>
      </div>

      {/* Recent Requirements Table */}
      <div className="org-card">
        <div className="org-card-header">
          <div className="org-card-title">
            <span className="org-card-title-dot" />
            Recent Requirements
          </div>
          <button
            className="org-btn-secondary"
            style={{ padding: "6px 14px", fontSize: 13 }}
            onClick={() => navigate("/organization/my-requirements")}
          >
            View All →
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>Loading requirements…</div>
        ) : requirements.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>
            <p style={{ marginBottom: 12 }}>No requirements posted yet.</p>
            <button className="org-btn-primary" onClick={() => navigate("/organization/create-requirement")}>
              Post Your First Requirement
            </button>
          </div>
        ) : (
          <div className="org-table-wrapper">
            <table className="org-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Quantity Needed</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Posted Date</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{req.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{req.location}</div>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{req.category}</td>
                    <td style={{ fontWeight: 600 }}>{req.quantity}</td>
                    <td>
                      <span className={`org-badge ${URGENCY_BADGES[req.urgency] || "org-badge-urgent-medium"}`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td>
                      <span className={`org-badge org-badge-${req.status}`}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: 13 }}>
                      {new Date(req.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
