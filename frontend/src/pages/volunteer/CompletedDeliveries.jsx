import { useState, useEffect } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";

const BACKEND_URL = "http://localhost:5000";

export default function CompletedDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompleted = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/deliveries/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const completed = (res.data.deliveries || []).filter((d) => d.status === "delivered");
        setDeliveries(completed);
      } catch (err) {
        toast.error("Failed to load delivery history.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompleted();
  }, []);

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>Completed Deliveries History</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          A record of all your successfully completed humanitarian deliveries.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>Loading history…</div>
      ) : deliveries.length === 0 ? (
        <div className="vol-card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🏁</div>
          <h3 style={{ color: "#1e293b", marginBottom: 6 }}>No Completed Deliveries Yet</h3>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            When you complete assigned tasks, your delivery records & proof photos will be saved here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {deliveries.map((del) => (
            <div key={del._id} className="vol-card" style={{ borderLeft: "5px solid #10b981" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>
                    {del.donationId?.donationName || "Relief Supply Item"}
                  </h3>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    📍 <strong>Pickup:</strong> {del.pickupAddress} → <strong>Drop:</strong> {del.dropAddress}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      background: "#d1fae5",
                      color: "#047857",
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    ✓ Delivered
                  </span>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {del.deliveredAt ? new Date(del.deliveredAt).toLocaleString("en-IN") : "Completed"}
                  </div>
                </div>
              </div>

              {/* Proof photos */}
              {del.proofImages?.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>📷 Delivery Proof</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {del.proofImages.map((img, i) => (
                      <img
                        key={i}
                        src={`${BACKEND_URL}/${img}`}
                        alt="proof"
                        style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "2px solid #10b981" }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {del.proofNote && (
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 8, fontStyle: "italic" }}>
                  Note: {del.proofNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
