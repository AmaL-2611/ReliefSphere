import { useState, useEffect } from "react";
import API from "../../api/axios";

const STATUS_BADGES = {
  pending: { label: "Pending Approval", bg: "#fef3c7", color: "#d97706" },
  open: { label: "Approved / Open", bg: "#dcfce7", color: "#15803d" },
  matched: { label: "Matched", bg: "#e0f2fe", color: "#0369a1" },
  fulfilled: { label: "Fulfilled", bg: "#f0fdf4", color: "#16a34a" },
  closed: { label: "Closed", bg: "#f1f5f9", color: "#64748b" },
  rejected: { label: "Rejected", bg: "#fef2f2", color: "#dc2626" },
};

const URGENCY_BADGES = {
  low: { label: "Low", bg: "#f0fdf4", color: "#16a34a" },
  medium: { label: "Medium", bg: "#fffbeb", color: "#d97706" },
  high: { label: "High", bg: "#fef2f2", color: "#dc2626" },
  critical: { label: "Critical", bg: "#ffe4e6", color: "#991b1b" },
};

export default function AdminRequirements() {
  const [requirements, setRequirements] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    open: 0,
    matched: 0,
    fulfilled: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchRequirements();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const res = await API.get("/requirements/admin/all", getAuthHeader());
      if (res.data) {
        setRequirements(res.data.requirements || []);
        setStats(res.data.stats || {});
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load requirements", "error");
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

  const handleUpdateStatus = async (id, status) => {
    try {
      setSubmittingAction(true);
      const res = await API.patch(
        `/requirements/${id}/status`,
        { status },
        getAuthHeader()
      );
      if (res.data) {
        showToast(
          status === "open"
            ? "Requirement approved and set to Open!"
            : `Requirement status updated to ${status}.`
        );
        if (selectedReq && selectedReq._id === id) setSelectedReq(null);
        fetchRequirements();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredRequirements = requirements.filter((r) => {
    const matchesTab = activeTab === "all" ? true : r.status === activeTab;
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search.trim() === "" ||
      (r.title || "").toLowerCase().includes(searchLower) ||
      (r.organizationId?.orgName || "").toLowerCase().includes(searchLower) ||
      (r.category || "").toLowerCase().includes(searchLower) ||
      (r.location || "").toLowerCase().includes(searchLower);

    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Toast Notification */}
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
          Resource Requirement Verification & Management 📋
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Review organization resource requests before approving them for public donor matching.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Total Requirements</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {loading ? "…" : stats.total || 0}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: 13, color: "#d97706", fontWeight: 700 }}>⏳ Pending Approval</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#d97706", marginTop: 4 }}>
            {loading ? "…" : stats.pending || 0}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: 13, color: "#059669", fontWeight: 700 }}>✅ Open / Approved</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#059669", marginTop: 4 }}>
            {loading ? "…" : stats.open || 0}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderLeft: "4px solid #0284c7" }}>
          <div style={{ fontSize: 13, color: "#0369a1", fontWeight: 700 }}>Matched / Fulfilled</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
            {loading ? "…" : (stats.matched || 0) + (stats.fulfilled || 0)}
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
            { key: "all", label: "All Requirements" },
            { key: "pending", label: `Pending Approval (${stats.pending || 0})` },
            { key: "open", label: `Open (${stats.open || 0})` },
            { key: "matched", label: "Matched" },
            { key: "fulfilled", label: "Fulfilled" },
            { key: "rejected", label: "Rejected" },
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
                background: activeTab === tab.key ? "#0891b2" : "#f1f5f9",
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
          placeholder="Search requirement, org, category…"
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

      {/* Requirements Table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#64748b" }}>Loading requirement requests…</div>
        ) : filteredRequirements.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#64748b" }}>
            No requirements found matching filter.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 12, textTransform: "uppercase", color: "#64748b" }}>
                  <th style={{ padding: "16px 20px" }}>Requirement Title & Org</th>
                  <th style={{ padding: "16px 20px" }}>Category</th>
                  <th style={{ padding: "16px 20px" }}>Quantity</th>
                  <th style={{ padding: "16px 20px" }}>Urgency</th>
                  <th style={{ padding: "16px 20px" }}>Status</th>
                  <th style={{ padding: "16px 20px" }}>Posted Date</th>
                  <th style={{ padding: "16px 20px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequirements.map((r) => {
                  const statusInfo = STATUS_BADGES[r.status] || STATUS_BADGES.pending;
                  const urgencyInfo = URGENCY_BADGES[r.urgency?.toLowerCase()] || URGENCY_BADGES.medium;

                  return (
                    <tr key={r._id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: 14 }}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          🏢 {r.organizationId?.orgName || "Organization"} {r.location ? `• 📍 ${r.location}` : ""}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: 600, color: "#334155" }}>
                          {r.category}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: 700, color: "#0f172a" }}>
                        {r.quantity} {r.unit || "Items"}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            background: urgencyInfo.bg,
                            color: urgencyInfo.color,
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {urgencyInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748b" }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            onClick={() => setSelectedReq(r)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              background: "#f1f5f9",
                              border: "1px solid #cbd5e1",
                              cursor: "pointer",
                              color: "#334155",
                            }}
                          >
                            Details
                          </button>

                          {r.status === "pending" && (
                            <>
                              <button
                                disabled={submittingAction}
                                onClick={() => handleUpdateStatus(r._id, "open")}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  background: "#10b981",
                                  color: "#fff",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                Approve
                              </button>
                              <button
                                disabled={submittingAction}
                                onClick={() => handleUpdateStatus(r._id, "rejected")}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  background: "#ef4444",
                                  color: "#fff",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                Reject
                              </button>
                            </>
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

      {/* Requirement Details Modal */}
      {selectedReq && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{selectedReq.title}</h2>
              <button
                onClick={() => setSelectedReq(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20, background: "#f8fafc", padding: 16, borderRadius: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Organization</div>
                <div style={{ fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  {selectedReq.organizationId?.orgName || "N/A"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Category & Urgency</div>
                <div style={{ fontWeight: 700, color: "#0f172a", marginTop: 2, textTransform: "capitalize" }}>
                  {selectedReq.category} • {selectedReq.urgency} Urgency
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Quantity Needed</div>
                <div style={{ fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  {selectedReq.quantity} {selectedReq.unit}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Beneficiaries</div>
                <div style={{ fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  {selectedReq.beneficiaryCount || 0} ({selectedReq.beneficiaryType})
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>Delivery Location</div>
                <div style={{ fontWeight: 600, color: "#334155", marginTop: 2 }}>
                  📍 {selectedReq.location || "Not specified"}
                </div>
              </div>
            </div>

            {selectedReq.description && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Description / Context:</div>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.5, background: "#f1f5f9", padding: 12, borderRadius: 8 }}>
                  {selectedReq.description}
                </p>
              </div>
            )}

            {selectedReq.imageUrl && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Attached Evidence Photo:</div>
                <img
                  src={selectedReq.imageUrl}
                  alt="Evidence"
                  style={{ width: "100%", maxHeight: 250, objectFit: "cover", borderRadius: 12, border: "1px solid #e2e8f0" }}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setSelectedReq(null)}
                style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", fontWeight: 600, cursor: "pointer" }}
              >
                Close
              </button>
              {selectedReq.status === "pending" && (
                <>
                  <button
                    disabled={submittingAction}
                    onClick={() => handleUpdateStatus(selectedReq._id, "open")}
                    style={{ padding: "8px 20px", borderRadius: 8, background: "#10b981", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
                  >
                    Approve Requirement
                  </button>
                  <button
                    disabled={submittingAction}
                    onClick={() => handleUpdateStatus(selectedReq._id, "rejected")}
                    style={{ padding: "8px 20px", borderRadius: 8, background: "#ef4444", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
