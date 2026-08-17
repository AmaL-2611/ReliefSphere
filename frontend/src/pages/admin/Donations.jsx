import { useState, useEffect } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";

const STATUS_BADGES = {
  pending: { label: "Pending", bg: "#fff7ed", color: "#c2410c" },
  matched: { label: "AI Matched", bg: "#fef3c7", color: "#b45309" },
  accepted: { label: "Accepted", bg: "#e0f2fe", color: "#0369a1" },
  assigned: { label: "Volunteer Assigned", bg: "#e0e7ff", color: "#4338ca" },
  picked_up: { label: "In Transit", bg: "#fef9c3", color: "#a16207" },
  delivered: { label: "Delivered", bg: "#d1fae5", color: "#047857" },
  cancelled: { label: "Cancelled", bg: "#fee2e2", color: "#b91c1c" },
};

export default function Donations() {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  // Volunteer assignment modal
  const [assignModal, setAssignModal] = useState(null); // donation object
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/donations/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonations(res.data.donations || []);
      setStats(res.data.stats || {});
    } catch (err) {
      toast.error("Failed to load donations monitoring data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifiedVolunteers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/admin/volunteers?status=verified", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVolunteers(res.data.volunteers || []);
    } catch (err) {
      toast.error("Failed to load volunteers.");
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const openAssignModal = (donation) => {
    setAssignModal(donation);
    fetchVerifiedVolunteers();
  };

  const handleAssignVolunteer = async (e) => {
    e.preventDefault();
    if (!selectedVolunteer) return toast.error("Please select a volunteer.");

    setAssigning(true);
    try {
      const token = localStorage.getItem("token");
      await API.post(
        "/deliveries/admin/assign",
        {
          donationId: assignModal._id,
          volunteerId: selectedVolunteer,
          scheduledTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Volunteer assigned to delivery!");
      setAssignModal(null);
      setSelectedVolunteer("");
      fetchDonations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign volunteer.");
    } finally {
      setAssigning(false);
    }
  };

  const handleRematch = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(`/donations/admin/${id}/rematch`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.bestMatch) {
        toast.success(`🎯 Rematched! Score: ${res.data.bestMatch.score}%`);
      } else {
        toast.info("No higher match found.");
      }
      fetchDonations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to run AI match.");
    }
  };

  const filtered = filterStatus === "all"
    ? donations
    : donations.filter((d) => d.status === filterStatus);

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>Donations Monitoring</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Track real-time donation flows, review AI matches, and assign volunteers for logistics.
        </p>
      </div>

      {/* Summary Pills */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          { key: "all", label: `All (${stats.total || 0})`, bg: "#10b981", color: "#white" },
          { key: "pending", label: `Pending (${stats.pending || 0})`, bg: "#fff7ed", color: "#ea580c" },
          { key: "matched", label: `Matched (${stats.matched || 0})`, bg: "#fef3c7", color: "#b45309" },
          { key: "accepted", label: `Accepted (${stats.accepted || 0})`, bg: "#e0f2fe", color: "#0284c7" },
          { key: "delivered", label: `Delivered (${stats.delivered || 0})`, bg: "#d1fae5", color: "#047857" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            style={{
              padding: "8px 16px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13,
              border: "1px solid",
              borderColor: filterStatus === tab.key ? "#10b981" : "#e2e8f0",
              background: filterStatus === tab.key ? "#10b981" : "#ffffff",
              color: filterStatus === tab.key ? "#ffffff" : "#475569",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>Loading donations…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>No donations found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>Donation</th>
                  <th style={{ padding: "12px 16px" }}>Donor</th>
                  <th style={{ padding: "12px 16px" }}>Category & Qty</th>
                  <th style={{ padding: "12px 16px" }}>Matched NGO</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const sb = STATUS_BADGES[d.status] || STATUS_BADGES.pending;

                  return (
                    <tr key={d._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#1e293b" }}>{d.donationName}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>📍 {d.pickupAddress}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600 }}>{d.postedBy?.fullName || "Donor"}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{d.postedBy?.email}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{d.category}</span> × {d.quantity}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {d.matchedOrganization?.orgName ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "#0891b2" }}>{d.matchedOrganization.orgName}</div>
                            {d.matchScore && <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>🎯 {d.matchScore}% Match</span>}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>Unmatched</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            background: sb.bg,
                            color: sb.color,
                            padding: "4px 12px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {sb.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          {["accepted", "matched"].includes(d.status) && (
                            <button
                              style={{
                                background: "#4f46e5",
                                color: "white",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                              id={`assign-vol-${d._id}`}
                              onClick={() => openAssignModal(d)}
                            >
                              🚗 Assign Volunteer
                            </button>
                          )}
                          {["pending", "matched"].includes(d.status) && (
                            <button
                              style={{
                                background: "#ecfeff",
                                color: "#0891b2",
                                border: "1px solid #a5f3fc",
                                padding: "6px 12px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                              onClick={() => handleRematch(d._id)}
                            >
                              🤖 AI Match
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

      {/* Assign Volunteer Modal */}
      {assignModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setAssignModal(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 28,
              maxWidth: 460,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: "#1e293b" }}>Assign Volunteer to Delivery</h3>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              Donation: <strong>{assignModal.donationName}</strong> ({assignModal.category})
            </p>

            <form onSubmit={handleAssignVolunteer}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>
                  Select Verified Volunteer
                </label>
                <select
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 }}
                  value={selectedVolunteer}
                  onChange={(e) => setSelectedVolunteer(e.target.value)}
                  required
                >
                  <option value="">Select volunteer…</option>
                  {volunteers.map((vol) => (
                    <option key={vol._id} value={vol._id}>
                      {vol.userId?.fullName || "Volunteer"} — {vol.address || "Available"}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>
                  Scheduled Pickup Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 }}
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", background: "#f1f5f9", fontWeight: 600, cursor: "pointer" }}
                  onClick={() => setAssignModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#4f46e5", color: "white", fontWeight: 700, cursor: "pointer" }}
                  disabled={assigning}
                >
                  {assigning ? "Assigning…" : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
