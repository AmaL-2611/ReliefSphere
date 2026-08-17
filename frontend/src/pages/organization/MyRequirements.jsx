import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";

const URGENCY_BADGES = {
  critical: "org-badge-urgent-critical",
  high: "org-badge-urgent-high",
  medium: "org-badge-urgent-medium",
  low: "org-badge-urgent-low",
};

export default function MyRequirements() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/requirements/org/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequirements(res.data.requirements || []);
      setStats(res.data.stats || {});
    } catch (err) {
      toast.error("Failed to load requirements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/requirements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Requirement deleted.");
      setRequirements((prev) => prev.filter((r) => r._id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = filterStatus === "all"
    ? requirements
    : requirements.filter((r) => r.status === filterStatus);

  return (
    <>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>My Posted Requirements</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Monitor, edit, and track fulfillment status of your posted requirements.
          </p>
        </div>
        <button
          className="org-btn-primary"
          id="post-new-req-btn"
          onClick={() => navigate("/organization/create-requirement")}
        >
          ➕ Post Requirement
        </button>
      </div>

      {/* Status Notice Banner */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, color: "#1e40af", fontSize: 13 }}>
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <div>
          <strong>Admin Approval Policy:</strong> Newly submitted requirements remain <em>Pending Approval</em> until reviewed by an administrator. Once approved, they will automatically become <em>Open</em> and visible to donors.
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { key: "all", label: `All (${stats.total || 0})` },
          { key: "pending", label: `Pending Approval (${stats.pending || 0})` },
          { key: "open", label: `Open/Approved (${stats.open || 0})` },
          { key: "matched", label: `Matched (${stats.matched || 0})` },
          { key: "fulfilled", label: `Fulfilled (${stats.fulfilled || 0})` },
          { key: "rejected", label: `Rejected (${stats.rejected || 0})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            style={{
              padding: "8px 18px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13,
              border: "1px solid",
              borderColor: filterStatus === tab.key ? "#0891b2" : "#e2e8f0",
              background: filterStatus === tab.key ? "#0891b2" : "#ffffff",
              color: filterStatus === tab.key ? "#ffffff" : "#64748b",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="org-card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>Loading requirements…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
            <p style={{ fontWeight: 600 }}>No requirements found in this view.</p>
          </div>
        ) : (
          <div className="org-table-wrapper">
            <table className="org-table">
              <thead>
                <tr>
                  <th>Title & Location</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Posted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{req.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>📍 {req.location}</div>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{req.category}</td>
                    <td style={{ fontWeight: 700 }}>{req.quantity}</td>
                    <td>
                      <span className={`org-badge ${URGENCY_BADGES[req.urgency] || "org-badge-urgent-medium"}`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td>
                      {req.status === "pending" && (
                        <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                          ⏳ Pending Approval
                        </span>
                      )}
                      {req.status === "open" && (
                        <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                          🟢 Open (Live)
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                          ❌ Rejected
                        </span>
                      )}
                      {req.status !== "pending" && req.status !== "open" && req.status !== "rejected" && (
                        <span className={`org-badge org-badge-${req.status}`}>
                          {req.status}
                        </span>
                      )}
                    </td>
                    <td style={{ color: "#64748b", fontSize: 13 }}>
                      {new Date(req.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      {req.status === "open" || req.status === "pending" || req.status === "rejected" ? (
                        <button
                          style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          id={`delete-req-${req._id}`}
                          onClick={() => setDeleteConfirm(req._id)}
                        >
                          🗑 Delete
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>In Progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 28,
              maxWidth: 380,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <h3 style={{ textAlign: "center", marginBottom: 8, color: "#1e293b" }}>Delete Requirement?</h3>
            <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, marginBottom: 24 }}>
              Are you sure you want to delete this open requirement?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="org-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "11px 0",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                id="confirm-delete-req-btn"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
