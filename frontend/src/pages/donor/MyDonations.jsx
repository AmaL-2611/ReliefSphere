import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";

const STATUS_MAP = {
  pending: { label: "Pending NGO Approval ⏳", bg: "#fef3c7", color: "#92400e" },
  matched: { label: "Matched 🎯", bg: "#e0f2fe", color: "#0369a1" },
  accepted: { label: "Accepted 🟢", bg: "#dcfce7", color: "#15803d" },
  rejected: { label: "Rejected 🔴", bg: "#fee2e2", color: "#991b1b" },
  assigned: { label: "In Transit 🚚", bg: "#fef9c3", color: "#a16207" },
  picked_up: { label: "In Transit 🚚", bg: "#e0e7ff", color: "#3730a3" },
  delivered: { label: "Delivered ✅", bg: "#d1fae5", color: "#047857" },
  cancelled: { label: "Cancelled ❌", bg: "#f1f5f9", color: "#64748b" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, bg: "#f1f5f9", color: "#475569" };
  return (
    <span
      style={{
        padding: "5px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        display: "inline-block",
      }}
    >
      {s.label}
    </span>
  );
}

export default function MyDonations() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/donations/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonations(res.data.donations || []);
      setStats(res.data.stats || {});
    } catch (err) {
      toast.error("Failed to load donations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/donations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Donation deleted.");
      setDonations((prev) => prev.filter((d) => d._id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await API.patch(`/donations/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Donation cancelled.");
      fetchDonations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel.");
    }
  };

  const filtered = filterStatus === "all"
    ? donations
    : donations.filter((d) => d.status === filterStatus);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">My Pledged Donations</h1>
        <p className="page-subtitle">Track and manage all your requirement pledges and direct donations.</p>
      </div>

      {/* Summary Filter Pills */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { key: "all", label: "All Pledges", value: stats.total || 0, color: "#10b981", bg: "#d1fae5" },
          { key: "pending", label: "Pending Approval", value: stats.pending || 0, color: "#ea580c", bg: "#fff7ed" },
          { key: "accepted", label: "Accepted", value: donations.filter(d => d.status === "accepted").length, color: "#15803d", bg: "#dcfce7" },
          { key: "delivered", label: "Delivered", value: stats.delivered || 0, color: "#16a34a", bg: "#f0fdf4" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            style={{
              background: filterStatus === s.key ? s.color : s.bg,
              color: filterStatus === s.key ? "white" : s.color,
              padding: "8px 18px",
              borderRadius: 12,
              border: `1.5px solid ${filterStatus === s.key ? s.color : "transparent"}`,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 17 }}>{s.value}</span>
            <span style={{ fontWeight: 500 }}>{s.label}</span>
          </button>
        ))}

        <button
          className="btn-submit"
          style={{ marginLeft: "auto", padding: "9px 20px", fontSize: 13 }}
          onClick={() => navigate("/donor/browse-requirements")}
          id="browse-req-cta-btn"
        >
          🔍 Browse NGO Requirements
        </button>
      </div>

      {/* Table */}
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <span className="section-card-title-dot" />
            {filterStatus === "all" ? "All Pledged Donations" : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Donations`}
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length} records</span>
        </div>
        <div className="section-card-body">
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <div className="empty-state-text">Loading pledges…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-text">No donation pledges found</div>
              <div className="empty-state-sub">
                <button
                  className="btn-submit"
                  style={{ marginTop: 14, padding: "10px 22px", fontSize: 13 }}
                  onClick={() => navigate("/donor/browse-requirements")}
                >
                  Browse Open Requirements to Donate
                </button>
              </div>
            </div>
          ) : (
            <table className="donor-table">
              <thead>
                <tr>
                  <th>Requirement Name</th>
                  <th>NGO Name</th>
                  <th>Quantity Pledged</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {d.matchedRequirement?.title || d.donationName}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>📍 {d.pickupAddress}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0284c7" }}>
                        {d.matchedOrganization?.orgName || "Hope Foundation"}
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: "#059669" }}>
                      {d.quantity} {d.unit || "Packets"}
                    </td>
                    <td style={{ color: "#64748b", fontSize: 12 }}>
                      {new Date(d.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 7 }}>
                        <button
                          className="action-btn action-btn-view"
                          id={`view-${d._id}`}
                          onClick={() => navigate(`/donor/track-donation?id=${d._id}`)}
                        >
                          👁 Track
                        </button>
                        {d.status === "pending" && (
                          <button
                            className="action-btn action-btn-delete"
                            id={`delete-${d._id}`}
                            onClick={() => setDeleteConfirm(d._id)}
                          >
                            🗑 Delete
                          </button>
                        )}
                        {["matched", "accepted"].includes(d.status) && (
                          <button
                            className="action-btn"
                            style={{ background: "#fef3c7", color: "#b45309", fontSize: 12 }}
                            onClick={() => handleCancel(d._id)}
                          >
                            ✕ Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{ background: "white", borderRadius: 16, padding: 28, maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <h3 style={{ textAlign: "center", marginBottom: 8, color: "#1e293b" }}>Delete Pledge?</h3>
            <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, marginBottom: 24 }}>
              This action cannot be undone. The donation pledge will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-change-pw" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                style={{ flex: 1, padding: "11px 0", background: "#ef4444", color: "white", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}
                id="confirm-delete-btn"
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
