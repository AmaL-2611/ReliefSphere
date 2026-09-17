import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";
import ChatModal from "../../components/chat/ChatModal";

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

  // Chat modal state
  const [chatConfig, setChatConfig] = useState({
    isOpen: false,
    conversationId: "",
    recipientId: "",
    recipientName: "",
    recipientRole: "",
    title: "",
  });

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
      <div style={{ padding: "8px 0" }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>My Relief Donations</h2>
            <p style={{ color: "#64748b", fontSize: 14 }}>
              Track the status of your pledged donations and communication with recipient organizations.
            </p>
          </div>
          <button
            className="action-btn"
            style={{ background: "#059669", color: "white", padding: "10px 18px", borderRadius: 10, fontWeight: 700 }}
            onClick={() => navigate("/donor/browse-requirements")}
          >
            + Pledge New Donation
          </button>
        </div>

        {/* Donations Table */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>Loading donations…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>No donations found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>Donation / Requirement</th>
                  <th style={{ padding: "12px 16px" }}>Recipient NGO</th>
                  <th style={{ padding: "12px 16px" }}>Quantity</th>
                  <th style={{ padding: "12px 16px" }}>Date</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d._id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: 14 }}>
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontWeight: 700, color: "#1e293b" }}>{d.donationName || d.matchedRequirement?.title || "Relief Supply"}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>📍 {d.pickupAddress}</div>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontWeight: 600, color: "#334155" }}>
                        🏢 {d.matchedOrganization?.orgName || "Recipient NGO"}
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
                      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                        <button
                          className="action-btn action-btn-view"
                          id={`view-${d._id}`}
                          onClick={() => navigate(`/donor/track-donation?id=${d._id}`)}
                        >
                          👁 Track
                        </button>

                        <button
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid #0891b2",
                            background: "#ecfeff",
                            color: "#0891b2",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            const orgUser = d.matchedOrganization;
                            setChatConfig({
                              isOpen: true,
                              conversationId: `conv_donation_${d._id}_donor`,
                              recipientId: orgUser?.userId || orgUser?._id,
                              recipientName: orgUser?.orgName || "Organization",
                              recipientRole: "Organization",
                              title: `Logistics Chat - ${d.donationName}`,
                            });
                          }}
                        >
                          💬 Chat
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

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatConfig.isOpen}
        onClose={() => setChatConfig((prev) => ({ ...prev, isOpen: false }))}
        conversationId={chatConfig.conversationId}
        recipientId={chatConfig.recipientId}
        recipientName={chatConfig.recipientName}
        recipientRole={chatConfig.recipientRole}
        title={chatConfig.title}
      />
    </>
  );
}
