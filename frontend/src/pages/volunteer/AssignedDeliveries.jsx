import { useState, useEffect } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";

export default function AssignedDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [proofNote, setProofNote] = useState("");
  const [proofFile, setProofFile] = useState(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/deliveries/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const active = (res.data.deliveries || []).filter((d) => d.status !== "delivered");
      setDeliveries(active);
    } catch (err) {
      toast.error("Failed to load deliveries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleMarkPickedUp = async (id) => {
    setActionId(id);
    try {
      const token = localStorage.getItem("token");
      await API.patch(`/deliveries/${id}/pickup`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Delivery marked as Picked Up!");
      fetchDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    } finally {
      setActionId(null);
    }
  };

  const handleMarkDelivered = async (id) => {
    setActionId(id);
    try {
      const token = localStorage.getItem("token");

      // Upload proof if file selected
      if (proofFile) {
        const formData = new FormData();
        formData.append("proofImages", proofFile);
        formData.append("proofNote", proofNote);
        await API.post(`/deliveries/${id}/proof`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      await API.patch(`/deliveries/${id}/deliver`, { proofNote }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("🎉 Delivery completed successfully! Donor notified.");
      setProofFile(null);
      setProofNote("");
      fetchDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as delivered.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>Assigned Deliveries</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Manage active pickup & delivery tasks assigned to you by administrators.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>Loading assigned tasks…</div>
      ) : deliveries.length === 0 ? (
        <div className="vol-card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🚗</div>
          <h3 style={{ color: "#1e293b", marginBottom: 6 }}>No Active Delivery Tasks</h3>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            You have no active pending pickups or deliveries assigned right now. Check back later!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {deliveries.map((del) => {
            const isAssigned = del.status === "assigned";
            const isInTransit = del.status === "picked_up" || del.status === "in_transit";

            return (
              <div key={del._id} className="vol-card" style={{ borderLeft: "5px solid #4f46e5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase" }}>
                      Task #{del._id.slice(-6)}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginTop: 2 }}>
                      {del.donationId?.donationName || "Relief Supply Item"}
                    </h3>
                  </div>

                  <span
                    style={{
                      background: isAssigned ? "#e0e7ff" : "#fef3c7",
                      color: isAssigned ? "#4338ca" : "#b45309",
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "capitalize",
                      height: "fit-content",
                    }}
                  >
                    {del.status?.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Addresses */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>📍 Pickup Location</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>
                      {del.pickupAddress}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Donor: {del.donationId?.postedBy?.fullName || "Donor"} ({del.donationId?.postedBy?.email})
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>🏢 Drop Location (NGO)</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>
                      {del.dropAddress || del.donationId?.matchedOrganization?.address || "NGO Destination"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Org: {del.donationId?.matchedOrganization?.orgName || "Recipient NGO"}
                    </div>
                  </div>
                </div>

                {/* Proof Section (when in transit) */}
                {isInTransit && (
                  <div style={{ marginBottom: 20, background: "#fff", border: "1px dashed #cbd5e1", padding: 16, borderRadius: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 10 }}>📷 Upload Proof of Delivery</div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProofFile(e.target.files[0])}
                        id={`proof-file-${del._id}`}
                        style={{ fontSize: 13 }}
                      />
                      <input
                        type="text"
                        placeholder="Add delivery note (optional)"
                        value={proofNote}
                        onChange={(e) => setProofNote(e.target.value)}
                        style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  {isAssigned && (
                    <button
                      className="vol-btn-primary"
                      id={`pickup-btn-${del._id}`}
                      onClick={() => handleMarkPickedUp(del._id)}
                      disabled={actionId === del._id}
                    >
                      {actionId === del._id ? "Updating…" : "📬 Mark as Picked Up"}
                    </button>
                  )}

                  {isInTransit && (
                    <button
                      className="vol-btn-primary"
                      id={`deliver-btn-${del._id}`}
                      style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                      onClick={() => handleMarkDelivered(del._id)}
                      disabled={actionId === del._id}
                    >
                      {actionId === del._id ? "Completing…" : "🎉 Mark as Delivered & Finish Task"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
