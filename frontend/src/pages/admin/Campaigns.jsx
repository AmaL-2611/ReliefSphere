import { useState, useEffect } from "react";
import API from "../../api/axios";

const STATUS_BADGES = {
  DRAFT: { label: "Draft", bg: "#f1f5f9", color: "#64748b" },
  PENDING_APPROVAL: { label: "Pending Approval", bg: "#fef3c7", color: "#d97706" },
  APPROVED: { label: "Approved", bg: "#eff6ff", color: "#2563eb" },
  ACTIVE: { label: "Active", bg: "#f0fdf4", color: "#16a34a" },
  COMPLETED: { label: "Completed", bg: "#dcfce7", color: "#15803d" },
  REJECTED: { label: "Rejected", bg: "#fef2f2", color: "#dc2626" },
};

const URGENCY_BADGES = {
  Low: { bg: "#f0fdf4", color: "#16a34a" },
  Medium: { bg: "#fffbeb", color: "#d97706" },
  High: { bg: "#fef2f2", color: "#dc2626" },
  Critical: { bg: "#ffe4e6", color: "#991b1b" },
};

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    active: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [rejectReasonModal, setRejectReasonModal] = useState(null);
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await API.get("/campaigns", getAuthHeader());
      if (res.data.success) {
        setCampaigns(res.data.campaigns || []);
        setStats(res.data.stats || {});
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load campaigns", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleUpdateStatus = async (campaignId, status, rejectionReason = "") => {
    try {
      setSubmittingAction(true);
      const res = await API.patch(
        `/campaigns/${campaignId}/status`,
        { status, rejectionReason },
        getAuthHeader()
      );
      if (res.data.success) {
        showToast(`Campaign status updated to ${status}!`);
        if (rejectReasonModal) setRejectReasonModal(null);
        if (selectedCampaign) setSelectedCampaign(null);
        fetchCampaigns();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesTab =
      activeTab === "all" ? true : c.status === activeTab;
    const matchesSearch =
      search.trim() === "" ||
      (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.organizationId?.orgName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.disasterType || "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Toast */}
      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: "12px 24px",
            borderRadius: 8,
            color: "#fff",
            fontWeight: 600,
            background: toast.type === "error" ? "#ef4444" : "#10b981",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
          Humanitarian Campaign Verification & Management 🚨
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Review emergency disaster relief campaigns submitted by Community Shelters prior to public mobilization.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Total Relief Campaigns</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {loading ? "…" : stats.total || 0}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: 13, color: "#d97706", fontWeight: 700 }}>⏳ Pending Verification</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#d97706", marginTop: 4 }}>
            {loading ? "…" : stats.pending || 0}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: 13, color: "#059669", fontWeight: 700 }}>✅ Approved / Active</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#059669", marginTop: 4 }}>
            {loading ? "…" : stats.approved || 0}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderLeft: "4px solid #15803d" }}>
          <div style={{ fontSize: 13, color: "#15803d", fontWeight: 700 }}>Completed</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {loading ? "…" : stats.completed || 0}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderLeft: "4px solid #dc2626" }}>
          <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>Rejected</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {loading ? "…" : stats.rejected || 0}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All Campaigns" },
            { key: "PENDING_APPROVAL", label: `Pending Approval (${stats.pending || 0})` },
            { key: "APPROVED", label: "Approved" },
            { key: "ACTIVE", label: "Active" },
            { key: "COMPLETED", label: "Completed" },
            { key: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: activeTab === tab.key ? "#059669" : "#f1f5f9",
                color: activeTab === tab.key ? "#fff" : "#475569",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search campaign, shelter, disaster type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            minWidth: 260,
          }}
        />
      </div>

      {/* Campaigns Table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#64748b" }}>Loading disaster campaigns…</div>
        ) : filteredCampaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#64748b" }}>
            No campaigns found matching filter.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 18px", fontSize: 13, color: "#475569" }}>Relief Campaign</th>
                  <th style={{ padding: "14px 18px", fontSize: 13, color: "#475569" }}>Disaster & Goal</th>
                  <th style={{ padding: "14px 18px", fontSize: 13, color: "#475569" }}>Community Shelter</th>
                  <th style={{ padding: "14px 18px", fontSize: 13, color: "#475569" }}>Affected Impact</th>
                  <th style={{ padding: "14px 18px", fontSize: 13, color: "#475569" }}>Status</th>
                  <th style={{ padding: "14px 18px", fontSize: 13, color: "#475569" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((camp) => {
                  const statusInfo = STATUS_BADGES[camp.status] || STATUS_BADGES.PENDING_APPROVAL;
                  const urgencyStyle = URGENCY_BADGES[camp.urgency] || URGENCY_BADGES.Medium;

                  return (
                    <tr key={camp._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {camp.coverImage ? (
                            <img
                              src={camp.coverImage.startsWith("http") ? camp.coverImage : `http://localhost:5000/${camp.coverImage}`}
                              alt={camp.title}
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ width: 44, height: 44, borderRadius: 8, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                              🚨
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{camp.title}</div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>📍 {camp.location}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 700, color: "#dc2626", fontSize: 13 }}>{camp.disasterType || "Disaster"}</div>
                        <div style={{ fontSize: 12, color: "#0284c7", fontWeight: 600 }}>{camp.reliefGoal || camp.category}</div>
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>{camp.organizationId?.orgName || "Shelter"}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Reg: {camp.organizationId?.registrationNumber || "N/A"}</div>
                      </td>

                      <td style={{ padding: "14px 18px", fontSize: 12, color: "#334155" }}>
                        <div>👥 {camp.affectedPeopleCount || 0} People</div>
                        <div style={{ color: "#64748b" }}>🏠 {camp.affectedFamiliesCount || 0} Families</div>
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: 16,
                            background: statusInfo.bg,
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            onClick={() => setSelectedCampaign(camp)}
                            style={{
                              padding: "5px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              background: "#fff",
                              color: "#334155",
                              cursor: "pointer",
                            }}
                          >
                            Review Details
                          </button>

                          {camp.status === "PENDING_APPROVAL" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(camp._id, "APPROVED")}
                                disabled={submittingAction}
                                style={{
                                  padding: "5px 10px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  border: "none",
                                  background: "#059669",
                                  color: "#fff",
                                  cursor: "pointer",
                                }}
                              >
                                Approve
                              </button>

                              <button
                                onClick={() => setRejectReasonModal(camp)}
                                disabled={submittingAction}
                                style={{
                                  padding: "5px 10px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  border: "none",
                                  background: "#dc2626",
                                  color: "#fff",
                                  cursor: "pointer",
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {(camp.status === "APPROVED" || camp.status === "ACTIVE") && (
                            <button
                              onClick={() => handleUpdateStatus(camp._id, "COMPLETED")}
                              disabled={submittingAction}
                              style={{
                                padding: "5px 10px",
                                fontSize: 12,
                                fontWeight: 700,
                                borderRadius: 6,
                                border: "none",
                                background: "#15803d",
                                color: "#fff",
                                cursor: "pointer",
                              }}
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      {selectedCampaign && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 750,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 12, background: (STATUS_BADGES[selectedCampaign.status] || STATUS_BADGES.PENDING_APPROVAL).bg, color: (STATUS_BADGES[selectedCampaign.status] || STATUS_BADGES.PENDING_APPROVAL).color }}>
                  {(STATUS_BADGES[selectedCampaign.status] || STATUS_BADGES.PENDING_APPROVAL).label}
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>
                  {selectedCampaign.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedCampaign(null)}
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {selectedCampaign.coverImage && (
              <img
                src={selectedCampaign.coverImage.startsWith("http") ? selectedCampaign.coverImage : `http://localhost:5000/${selectedCampaign.coverImage}`}
                alt={selectedCampaign.title}
                style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 12, marginBottom: 20 }}
              />
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "#f8fafc", padding: 16, borderRadius: 12, fontSize: 13, marginBottom: 20 }}>
              <div><strong>Community Shelter:</strong> {selectedCampaign.organizationId?.orgName || "N/A"}</div>
              <div><strong>Reg Number:</strong> {selectedCampaign.organizationId?.registrationNumber || "N/A"}</div>
              <div><strong>Disaster Type:</strong> {selectedCampaign.disasterType || "N/A"}</div>
              <div><strong>Relief Goal:</strong> {selectedCampaign.reliefGoal || "N/A"}</div>
              <div><strong>Location:</strong> {selectedCampaign.location}</div>
              <div><strong>Urgency:</strong> {selectedCampaign.urgency}</div>
              <div><strong>Affected People:</strong> {selectedCampaign.affectedPeopleCount || 0}</div>
              <div><strong>Affected Families:</strong> {selectedCampaign.affectedFamiliesCount || 0}</div>
              <div><strong>Target Quantity:</strong> {selectedCampaign.targetQuantity || 0} Kits</div>
              <div><strong>Estimated Budget:</strong> ₹{(selectedCampaign.estimatedBudget || 0).toLocaleString("en-IN")}</div>
              <div><strong>Coordinator:</strong> {selectedCampaign.coordinatorName || "N/A"} ({selectedCampaign.coordinatorContact || "N/A"})</div>
              <div><strong>Duration:</strong> {new Date(selectedCampaign.startDate).toLocaleDateString("en-IN")} - {new Date(selectedCampaign.endDate).toLocaleDateString("en-IN")}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 6 }}>Campaign Summary</div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {selectedCampaign.description || "No description provided."}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 6 }}>Relief Distribution Plan</div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#f1f5f9", padding: 12, borderRadius: 8 }}>
                {selectedCampaign.distributionPlan || "No detailed distribution plan submitted."}
              </div>
            </div>

            {selectedCampaign.evidenceFiles && selectedCampaign.evidenceFiles.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 8 }}>
                  Official Evidence Documents ({selectedCampaign.evidenceFiles.length})
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {selectedCampaign.evidenceFiles.map((file, idx) => {
                    const fileUrl = file.startsWith("http") ? file : `http://localhost:5000/${file}`;
                    return (
                      <a
                        key={idx}
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "#e0f2fe",
                          color: "#0369a1",
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        📄 Evidence Proof #{idx + 1}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              {selectedCampaign.status === "PENDING_APPROVAL" && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedCampaign._id, "APPROVED")}
                    style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                  >
                    Approve Campaign
                  </button>
                  <button
                    onClick={() => {
                      setRejectReasonModal(selectedCampaign);
                      setSelectedCampaign(null);
                    }}
                    style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                  >
                    Reject Campaign
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedCampaign(null)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: 600, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectReasonModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div style={{ background: "#fff", borderRadius: 16, maxWidth: 480, width: "100%", padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
              Reject Campaign
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              Enter rejection reason for "{rejectReasonModal.title}".
            </p>
            <textarea
              rows={3}
              placeholder="Specify rejection reason..."
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, marginBottom: 16 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                onClick={() => setRejectReasonModal(null)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(rejectReasonModal._id, "REJECTED", rejectionReasonText)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontWeight: 700 }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
