import { useState, useEffect } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";

const BACKEND_URL = "http://localhost:5000";

const STATUS_BADGES = {
  assigned: { label: "Assigned", bg: "#e0e7ff", color: "#4338ca" },
  picked_up: { label: "In Transit", bg: "#fef9c3", color: "#a16207" },
  in_transit: { label: "In Transit", bg: "#fef9c3", color: "#a16207" },
  delivered: { label: "Delivered", bg: "#d1fae5", color: "#047857" },
  failed: { label: "Failed", bg: "#fee2e2", color: "#b91c1c" },
};

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProof, setSelectedProof] = useState(null); // proof images modal

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/deliveries/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeliveries(res.data.deliveries || []);
      setStats(res.data.stats || {});
    } catch (err) {
      toast.error("Failed to load delivery monitoring data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const filtered = filterStatus === "all"
    ? deliveries
    : deliveries.filter((d) => d.status === filterStatus);

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>Deliveries & Logistics Monitoring</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Track real-time volunteer pickup, in-transit movements, and proof of deliveries.
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>TOTAL DELIVERIES</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", marginTop: 4 }}>{stats.total || 0}</div>
        </div>
        <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5" }}>ASSIGNED</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#4f46e5", marginTop: 4 }}>{stats.assigned || 0}</div>
        </div>
        <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>IN TRANSIT</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#d97706", marginTop: 4 }}>{stats.inTransit || 0}</div>
        </div>
        <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>DELIVERED</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#059669", marginTop: 4 }}>{stats.delivered || 0}</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "assigned", "picked_up", "delivered"].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            style={{
              padding: "7px 16px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              border: "1px solid",
              borderColor: filterStatus === st ? "#4f46e5" : "#e2e8f0",
              background: filterStatus === st ? "#4f46e5" : "white",
              color: filterStatus === st ? "white" : "#475569",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {st.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>Loading deliveries…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>No delivery tasks found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>Donation</th>
                  <th style={{ padding: "12px 16px" }}>Pickup & Drop Address</th>
                  <th style={{ padding: "12px 16px" }}>Assigned Volunteer</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Proof</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((del) => {
                  const sb = STATUS_BADGES[del.status] || STATUS_BADGES.assigned;

                  return (
                    <tr key={del._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#1e293b" }}>
                          {del.donationId?.donationName || "Supply Item"}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", textTransform: "capitalize" }}>
                          {del.donationId?.category}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", maxWidth: 300 }}>
                        <div style={{ fontSize: 13, color: "#1e293b" }}>
                          📍 <strong>From:</strong> {del.pickupAddress}
                        </div>
                        <div style={{ fontSize: 13, color: "#1e293b", marginTop: 2 }}>
                          🏢 <strong>To:</strong> {del.dropAddress}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600 }}>{del.volunteerId?.userId?.fullName || "Volunteer"}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{del.volunteerId?.userId?.email}</div>
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
                        {del.proofImages?.length > 0 ? (
                          <button
                            style={{
                              background: "#d1fae5",
                              color: "#047857",
                              border: "none",
                              padding: "5px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                            onClick={() => setSelectedProof(del.proofImages)}
                          >
                            📷 View Proof ({del.proofImages.length})
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>No proof uploaded</span>
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

      {/* Proof Modal */}
      {selectedProof && (
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
          onClick={() => setSelectedProof(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 24,
              maxWidth: 500,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16, color: "#1e293b" }}>Delivery Proof Photos</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              {selectedProof.map((img, i) => (
                <img
                  key={i}
                  src={`${BACKEND_URL}/${img}`}
                  alt="proof"
                  style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 10, border: "2px solid #10b981" }}
                />
              ))}
            </div>
            <button
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#1e293b", color: "white", cursor: "pointer", fontWeight: 600 }}
              onClick={() => setSelectedProof(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
