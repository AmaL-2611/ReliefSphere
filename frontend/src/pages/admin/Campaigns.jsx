import { useState, useEffect } from "react";
import axios from "../../api/axios";
import { toast } from "react-toastify";

export default function RequirementApproval() {
  const [requirements, setRequirements] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    open: 0,
    rejected: 0,
    matched: 0,
    fulfilled: 0,
  });
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/requirements/admin/all?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequirements(res.data.requirements || []);
      setStats(res.data.stats || {});
    } catch (err) {
      console.error(err);
      toast.error("Failed to load requirement requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, newStatus) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/requirements/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(
        newStatus === "open"
          ? "✅ Requirement approved and published for donors!"
          : "❌ Requirement request rejected."
      );
      fetchRequirements();
      if (selectedReq?._id === id) setSelectedReq(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequirements = requirements.filter((req) => {
    const titleMatch = req.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const orgMatch = req.organizationId?.orgName?.toLowerCase().includes(searchQuery.toLowerCase());
    const catMatch = req.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || orgMatch || catMatch;
  });

  return (
    <div style={{ padding: "8px 4px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Requirement Requests Approval
          </h2>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Review, verify, and approve relief requirements submitted by registered recipient organizations.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: 0.5 }}>
            ⏳ Pending Approval
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#b45309", marginTop: 4 }}>
            {stats.pending || 0}
          </div>
          <div style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>Awaiting verification</div>
        </div>

        <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: 0.5 }}>
            🟢 Approved (Open)
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#15803d", marginTop: 4 }}>
            {stats.open || 0}
          </div>
          <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>Live on Donor Portal</div>
        </div>

        <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", textTransform: "uppercase", letterSpacing: 0.5 }}>
            ❌ Rejected
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#dc2626", marginTop: 4 }}>
            {stats.rejected || 0}
          </div>
          <div style={{ fontSize: 12, color: "#991b1b", marginTop: 2 }}>Declined requests</div>
        </div>

        <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>
            📊 Total Submitted
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#1e293b", marginTop: 4 }}>
            {stats.total || 0}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>All time requirements</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { key: "pending", label: `⏳ Pending (${stats.pending || 0})` },
            { key: "open", label: `🟢 Approved/Open (${stats.open || 0})` },
            { key: "rejected", label: `❌ Rejected (${stats.rejected || 0})` },
            { key: "all", label: `All (${stats.total || 0})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: "9px 18px",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 13,
                border: "1px solid",
                borderColor: statusFilter === tab.key ? "#0284c7" : "#cbd5e1",
                background: statusFilter === tab.key ? "#0284c7" : "#ffffff",
                color: statusFilter === tab.key ? "#ffffff" : "#475569",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by title, category, org name…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "9px 16px",
            borderRadius: 12,
            border: "1.5px solid #cbd5e1",
            fontSize: 14,
            width: 280,
            outline: "none",
          }}
        />
      </div>

      {/* Main Table */}
      <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#64748b", fontWeight: 600 }}>
            Loading requirement requests…
          </div>
        ) : filteredRequirements.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#64748b" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>No requests found</div>
            <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
              There are currently no requirement requests matching this status filter.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  <th style={{ padding: "14px 18px" }}>Requirement Title</th>
                  <th style={{ padding: "14px 18px" }}>Organization</th>
                  <th style={{ padding: "14px 18px" }}>Category & Qty</th>
                  <th style={{ padding: "14px 18px" }}>Urgency</th>
                  <th style={{ padding: "14px 18px" }}>Status</th>
                  <th style={{ padding: "14px 18px" }}>Date</th>
                  <th style={{ padding: "14px 18px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequirements.map((req) => (
                  <tr key={req._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{req.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>📍 {req.location}</div>
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      <div style={{ fontWeight: 600, color: "#334155" }}>
                        {req.organizationId?.orgName || "Organization"}
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        By: {req.postedBy?.fullName || "User"}
                      </div>
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      <span style={{ textTransform: "capitalize", fontWeight: 600, color: "#0284c7" }}>
                        {req.category}
                      </span>
                      <div style={{ fontSize: 12, color: "#475569", fontWeight: 700 }}>
                        {req.quantity} units needed
                      </div>
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "capitalize",
                          background:
                            req.urgency === "critical"
                              ? "#fee2e2"
                              : req.urgency === "high"
                              ? "#ffedd5"
                              : "#fef9c3",
                          color:
                            req.urgency === "critical"
                              ? "#b91c1c"
                              : req.urgency === "high"
                              ? "#c2410c"
                              : "#a16207",
                        }}
                      >
                        {req.urgency}
                      </span>
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      {req.status === "pending" && (
                        <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                          ⏳ Pending Approval
                        </span>
                      )}
                      {req.status === "open" && (
                        <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                          🟢 Approved (Live)
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                          ❌ Rejected
                        </span>
                      )}
                      {req.status !== "pending" && req.status !== "open" && req.status !== "rejected" && (
                        <span style={{ background: "#e2e8f0", color: "#475569", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                          {req.status}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "16px 18px", color: "#64748b", fontSize: 13 }}>
                      {new Date(req.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td style={{ padding: "16px 18px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button
                          onClick={() => setSelectedReq(req)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          👁 View Details
                        </button>

                        {req.status === "pending" && (
                          <>
                            <button
                              disabled={processingId === req._id}
                              onClick={() => handleUpdateStatus(req._id, "open")}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: "#16a34a",
                                color: "#ffffff",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              ✅ Approve
                            </button>
                            <button
                              disabled={processingId === req._id}
                              onClick={() => handleUpdateStatus(req._id, "rejected")}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: "#dc2626",
                                color: "#ffffff",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                        {req.status === "open" && (
                          <button
                            disabled={processingId === req._id}
                            onClick={() => handleUpdateStatus(req._id, "rejected")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "none",
                              background: "#fee2e2",
                              color: "#dc2626",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Revoke / Reject
                          </button>
                        )}
                        {req.status === "rejected" && (
                          <button
                            disabled={processingId === req._id}
                            onClick={() => handleUpdateStatus(req._id, "open")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "none",
                              background: "#dcfce7",
                              color: "#15803d",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Re-approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setSelectedReq(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 32,
              maxWidth: 550,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0284c7", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {selectedReq.category} Requirement
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {selectedReq.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✖
              </button>
            </div>

            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Organization:</strong> {selectedReq.organizationId?.orgName || "N/A"}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Posted By:</strong> {selectedReq.postedBy?.fullName} ({selectedReq.postedBy?.email})
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Quantity Needed:</strong> {selectedReq.quantity}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Urgency:</strong> {selectedReq.urgency}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Delivery Location:</strong> 📍 {selectedReq.location}
              </div>
              <div>
                <strong>Description:</strong>
                <p style={{ margin: "4px 0 0 0", color: "#475569", lineHeight: 1.5 }}>
                  {selectedReq.description || "No additional description provided."}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              {selectedReq.status === "pending" && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedReq._id, "open")}
                    style={{ padding: "10px 20px", borderRadius: 10, background: "#16a34a", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
                  >
                    ✅ Approve & Publish
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReq._id, "rejected")}
                    style={{ padding: "10px 20px", borderRadius: 10, background: "#dc2626", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
                  >
                    ❌ Reject Request
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedReq(null)}
                style={{ padding: "10px 20px", borderRadius: 10, background: "#e2e8f0", color: "#334155", border: "none", fontWeight: 600, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
