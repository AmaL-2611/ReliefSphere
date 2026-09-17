import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";

const STATUS_BADGES = {
  DRAFT: { label: "Draft", bg: "#f1f5f9", color: "#64748b" },
  PENDING_APPROVAL: { label: "Pending Approval", bg: "#fef3c7", color: "#d97706" },
  APPROVED: { label: "Approved", bg: "#eff6ff", color: "#2563eb" },
  ACTIVE: { label: "Active", bg: "#f0fdf4", color: "#16a34a" },
  COMPLETED: { label: "Completed", bg: "#dcfce7", color: "#15803d" },
  REJECTED: { label: "Rejected", bg: "#fef2f2", color: "#dc2626" },
};

const URGENCY_COLORS = {
  Low: { bg: "#f0fdf4", color: "#16a34a" },
  Medium: { bg: "#fffbeb", color: "#d97706" },
  High: { bg: "#fef2f2", color: "#dc2626" },
  Critical: { bg: "#ffe4e6", color: "#991b1b" },
};

export default function MyCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, draft: 0, completed: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [allowedOrg, setAllowedOrg] = useState(true);

  const fetchMyCampaigns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await API.get("/campaigns/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setCampaigns(res.data.campaigns || []);
        setStats(res.data.stats || {});
        if (res.data.orgType && res.data.orgType !== "community_shelter") {
          setAllowedOrg(false);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCampaigns();
  }, []);

  const handleMarkCompleted = async (campaignId) => {
    if (!window.confirm("Are you sure you want to mark this campaign as COMPLETED?")) return;
    try {
      const token = localStorage.getItem("token");
      await API.patch(`/campaigns/${campaignId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Campaign marked as Completed!");
      fetchMyCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update campaign status.");
    }
  };

  if (!allowedOrg) {
    return (
      <div className="org-card" style={{ textAlign: "center", padding: 40, maxWidth: 600, margin: "40px auto" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>Access Restricted</h2>
        <p style={{ color: "#64748b", marginTop: 8 }}>
          Campaign management is available for Community Shelters and Emergency Relief Organizations only.
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Relief Campaigns Directory</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Monitor and manage emergency disaster relief campaigns and community mobilization drives.
          </p>
        </div>

        <button
          className="org-btn-primary"
          onClick={() => navigate("/organization/create-campaign")}
          style={{ background: "linear-gradient(135deg, #059669, #047857)", boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)" }}
        >
          ➕ Launch New Relief Campaign
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="org-stats-grid" style={{ marginBottom: 28 }}>
        <div className="org-stat-card">
          <div className="org-stat-accent" style={{ background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }} />
          <div className="org-stat-value">{loading ? "…" : stats.total || 0}</div>
          <div className="org-stat-label">Total Campaigns</div>
        </div>

        <div className="org-stat-card">
          <div className="org-stat-accent" style={{ background: "linear-gradient(90deg, #10b981, #34d399)" }} />
          <div className="org-stat-value">{loading ? "…" : stats.active || 0}</div>
          <div className="org-stat-label">Active / Live</div>
        </div>

        <div className="org-stat-card">
          <div className="org-stat-accent" style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }} />
          <div className="org-stat-value">{loading ? "…" : stats.pending || 0}</div>
          <div className="org-stat-label">Pending Approval</div>
        </div>

        <div className="org-stat-card">
          <div className="org-stat-accent" style={{ background: "linear-gradient(90deg, #15803d, #22c55e)" }} />
          <div className="org-stat-value">{loading ? "…" : stats.completed || 0}</div>
          <div className="org-stat-label">Completed Relieffs</div>
        </div>
      </div>

      {/* Campaigns Directory Card */}
      <div className="org-card">
        <div className="org-card-header">
          <div className="org-card-title">
            <span className="org-card-title-dot" style={{ background: "#059669" }} />
            Campaign Management
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>Loading relief campaigns…</div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#64748b" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚨</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#334155" }}>No Relief Campaigns Created</h3>
            <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 20 }}>
              Launch your first disaster relief or community crisis campaign to mobilize resources.
            </p>
            <button className="org-btn-primary" onClick={() => navigate("/organization/create-campaign")}>
              Launch Campaign Now
            </button>
          </div>
        ) : (
          <div className="org-table-wrapper">
            <table className="org-table">
              <thead>
                <tr>
                  <th>Campaign & Event</th>
                  <th>Relief Goal</th>
                  <th>Affected Impact</th>
                  <th>Progress / Target</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp) => {
                  const statusInfo = STATUS_BADGES[camp.status] || STATUS_BADGES.PENDING_APPROVAL;
                  const urgencyStyle = URGENCY_COLORS[camp.urgency] || URGENCY_COLORS.Medium;
                  const progressPct = camp.targetQuantity > 0
                    ? Math.min(100, Math.round(((camp.raisedQuantity || 0) / camp.targetQuantity) * 100))
                    : 0;

                  return (
                    <tr key={camp._id}>
                      <td>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          {camp.coverImage ? (
                            <img
                              src={camp.coverImage.startsWith("http") ? camp.coverImage : `http://localhost:5000/${camp.coverImage}`}
                              alt={camp.title}
                              style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: 8, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                              🚨
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{camp.title}</div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                              📍 {camp.location} • <span style={{ color: urgencyStyle.color, fontWeight: 700 }}>{camp.disasterType || "Disaster"}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0284c7" }}>
                          {camp.reliefGoal || camp.category}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>
                          <div>👥 {camp.affectedPeopleCount || 0} People</div>
                          <div style={{ color: "#64748b", fontSize: 11 }}>🏠 {camp.affectedFamiliesCount || 0} Families</div>
                        </div>
                      </td>

                      <td>
                        <div style={{ minWidth: 140 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                            <span>{camp.raisedQuantity || 0} / {camp.targetQuantity || 0} Kits</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div style={{ height: 6, width: "100%", background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg, #059669, #10b981)", borderRadius: 4 }} />
                          </div>
                        </div>
                      </td>

                      <td style={{ fontSize: 12, color: "#64748b" }}>
                        <div>Start: {new Date(camp.startDate).toLocaleDateString("en-IN")}</div>
                        <div>End: {new Date(camp.endDate).toLocaleDateString("en-IN")}</div>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: 20,
                            background: statusInfo.bg,
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                        {camp.rejectionReason && (
                          <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>
                            Reason: {camp.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td>
                        {(camp.status === "APPROVED" || camp.status === "ACTIVE") && (
                          <button
                            className="org-btn-secondary"
                            onClick={() => handleMarkCompleted(camp._id)}
                            style={{ padding: "5px 10px", fontSize: 12 }}
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
