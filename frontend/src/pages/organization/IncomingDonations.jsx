import { useState, useEffect } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";

const STATUS_BADGES = {
  pending: { label: "⏳ Pending Approval", bg: "#fef3c7", color: "#92400e" },
  matched: { label: "🎯 AI Matched", bg: "#e0f2fe", color: "#0369a1" },
  accepted: { label: "🟢 Accepted", bg: "#dcfce7", color: "#15803d" },
  rejected: { label: "❌ Rejected", bg: "#fee2e2", color: "#991b1b" },
  assigned: { label: "🚚 Assigned to Volunteer", bg: "#fef9c3", color: "#a16207" },
  picked_up: { label: "📦 Picked Up", bg: "#e0e7ff", color: "#3730a3" },
  delivered: { label: "✅ Delivered", bg: "#d1fae5", color: "#047857" },
};

export default function IncomingDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [rejectingDonation, setRejectingDonation] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIncomingDonations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/donations/org/incoming", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonations(res.data.donations || []);
    } catch (err) {
      toast.error("Failed to load incoming donations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomingDonations();
  }, []);

  const handleAccept = async (id) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      await API.post(`/donations/${id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Donation accepted!");
      fetchIncomingDonations();
      if (selectedDonation?._id === id) setSelectedDonation(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept donation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectingDonation) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      await API.post(`/donations/${rejectingDonation._id}/reject`, {
        reason: rejectionReason,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("❌ Donation rejected.");
      setRejectingDonation(null);
      setRejectionReason("");
      fetchIncomingDonations();
      if (selectedDonation?._id === rejectingDonation._id) setSelectedDonation(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject donation.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>Incoming Relief Donations</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Review, view donor details, accept pledges, or decline incoming donation requests for your requirements.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>Loading incoming donations…</div>
      ) : donations.length === 0 ? (
        <div className="org-card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🎁</div>
          <h3 style={{ color: "#1e293b", marginBottom: 6 }}>No Incoming Donations Received Yet</h3>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            When a donor pledges a donation for your requirement, it will appear here for review.
          </p>
        </div>
      ) : (
        <div className="org-card">
          <div className="org-table-wrapper">
            <table className="org-table">
              <thead>
                <tr>
                  <th>Donor Name</th>
                  <th>Requirement Title</th>
                  <th>Quantity Pledged</th>
                  <th>Pledge Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((don) => {
                  const badge = STATUS_BADGES[don.status] || STATUS_BADGES.pending;
                  const donorName = don.postedBy?.fullName || "Anonymous Donor";
                  const contact = don.contactNumber || don.postedBy?.phone || "N/A";
                  const reqTitle = don.matchedRequirement?.title || don.donationName || "General Donation";
                  const qtyDisplay = `${don.quantity} ${don.unit || "Packets"}`;

                  return (
                    <tr key={don._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{donorName}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>📞 {contact}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{reqTitle}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>📍 {don.pickupAddress}</div>
                      </td>
                      <td style={{ fontWeight: 800, color: "#059669" }}>
                        {qtyDisplay}
                      </td>
                      <td style={{ color: "#64748b", fontSize: 13 }}>
                        {new Date(don.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => setSelectedDonation(don)}
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
                            👁 View
                          </button>

                          {(don.status === "pending" || don.status === "matched") && (
                            <>
                              <button
                                className="org-btn-primary"
                                style={{ padding: "6px 12px", fontSize: 12 }}
                                onClick={() => handleAccept(don._id)}
                                disabled={actionLoading}
                              >
                                ✅ Accept
                              </button>

                              <button
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
                                onClick={() => setRejectingDonation(don)}
                                disabled={actionLoading}
                              >
                                ❌ Reject
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
        </div>
      )}

      {/* View Donation Details Modal */}
      {selectedDonation && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setSelectedDonation(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 28,
              maxWidth: 550,
              width: "100%",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0891b2", textTransform: "uppercase" }}>Donation Details</span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {selectedDonation.donationName || selectedDonation.matchedRequirement?.title}
                </h3>
              </div>
              <button onClick={() => setSelectedDonation(null)} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer" }}>✖</button>
            </div>

            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Donor Name:</strong> {selectedDonation.postedBy?.fullName || "Anonymous"}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Contact Phone:</strong> {selectedDonation.contactNumber || selectedDonation.postedBy?.phone || "N/A"}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Quantity:</strong> {selectedDonation.quantity} {selectedDonation.unit || "Packets"}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Pickup Address:</strong> 📍 {selectedDonation.pickupAddress}
              </div>
              <div>
                <strong>Additional Notes:</strong>
                <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{selectedDonation.notes || "No special notes."}</p>
              </div>
            </div>

            {selectedDonation.image && (
              <div style={{ marginBottom: 20 }}>
                <strong style={{ fontSize: 13, display: "block", marginBottom: 6 }}>Donation Photo:</strong>
                <img
                  src={selectedDonation.image}
                  alt="Donation"
                  style={{ maxHeight: 180, borderRadius: 12, objectFit: "cover", width: "100%" }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              {(selectedDonation.status === "pending" || selectedDonation.status === "matched") && (
                <>
                  <button
                    className="org-btn-primary"
                    onClick={() => handleAccept(selectedDonation._id)}
                    disabled={actionLoading}
                  >
                    ✅ Accept Donation
                  </button>
                  <button
                    style={{ padding: "10px 20px", borderRadius: 10, background: "#dc2626", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
                    onClick={() => {
                      const don = selectedDonation;
                      setSelectedDonation(null);
                      setRejectingDonation(don);
                    }}
                    disabled={actionLoading}
                  >
                    ❌ Reject
                  </button>
                </>
              )}
              <button className="org-btn-secondary" onClick={() => setSelectedDonation(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingDonation && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setRejectingDonation(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 28,
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
              Reject Donation Pledge
            </h3>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
              Please state the reason for declining this donation pledge to inform the donor.
            </p>

            <form onSubmit={handleReject}>
              <textarea
                required
                className="org-textarea"
                placeholder="e.g. Quantity limit exceeded, incorrect item category, storage full…"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                style={{ marginBottom: 20 }}
              />

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "#dc2626", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
                >
                  {actionLoading ? "Rejecting…" : "Confirm Rejection"}
                </button>
                <button
                  type="button"
                  className="org-btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setRejectingDonation(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
