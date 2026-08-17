import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";

const BACKEND_URL = "http://localhost:5000";

const STAGE_DEFS = [
  { key: "created",   label: "Donation Created",    icon: "📦" },
  { key: "matched",   label: "NGO Matched by AI",   icon: "🤖" },
  { key: "accepted",  label: "NGO Accepted",         icon: "✅" },
  { key: "assigned",  label: "Volunteer Assigned",   icon: "🚗" },
  { key: "picked_up", label: "Picked Up",            icon: "📬" },
  { key: "delivered", label: "Delivered",            icon: "🎉" },
];

const STATUS_ORDER = ["pending", "matched", "accepted", "assigned", "picked_up", "delivered", "cancelled"];

function getCompletedStages(status) {
  const statusToStageIndex = {
    pending:   0,  // only created
    matched:   1,
    accepted:  2,
    assigned:  3,
    picked_up: 4,
    delivered: 5,
    cancelled: 0,
  };
  return statusToStageIndex[status] ?? 0;
}

export default function TrackDonation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get("id");

  const [donations, setDonations] = useState([]);
  const [selectedId, setSelectedId] = useState(preselectedId || "");
  const [donation, setDonation] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  // Fetch list of all donor's donations for the selector
  useEffect(() => {
    const fetchList = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/donations/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = res.data.donations || [];
        setDonations(list);
        if (!preselectedId && list.length > 0) {
          setSelectedId(list[0]._id);
        }
      } catch (err) {
        toast.error("Failed to load donations.");
      } finally {
        setListLoading(false);
      }
    };
    fetchList();
  }, [preselectedId]);

  // Fetch single donation detail when selectedId changes
  useEffect(() => {
    if (!selectedId) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/donations/${selectedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDonation(res.data.donation);
        setDelivery(res.data.delivery);
      } catch (err) {
        toast.error("Failed to load donation details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [selectedId]);

  const completedIdx = donation ? getCompletedStages(donation.status) : 0;
  const progressPct = donation
    ? donation.status === "cancelled"
      ? 0
      : Math.round((completedIdx / (STAGE_DEFS.length - 1)) * 100)
    : 0;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Track Donation</h1>
        <p className="page-subtitle">Follow your donation's real-time journey from creation to delivery.</p>
      </div>

      {/* Selector */}
      <div className="track-select-wrap">
        <label htmlFor="track-select">Select Donation to Track</label>
        {listLoading ? (
          <p style={{ color: "#94a3b8", fontSize: 13 }}>Loading donations…</p>
        ) : donations.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 13 }}>
            No donations yet.{" "}
            <button
              className="action-btn action-btn-view"
              style={{ display: "inline-flex", padding: "5px 14px" }}
              onClick={() => navigate("/donor/create-donation")}
            >
              Create one
            </button>
          </p>
        ) : (
          <select
            className="form-control"
            id="track-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ maxWidth: 420 }}
          >
            {donations.map((d) => (
              <option key={d._id} value={d._id}>
                {d.donationName} ({d.category}) — {d.status}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <div className="empty-state" style={{ padding: "40px 0" }}>
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Loading tracking data…</div>
        </div>
      )}

      {!loading && donation && (
        <div className="track-container">
          {/* ── Timeline ── */}
          <div className="timeline-card">
            <div className="timeline-header">
              <h3>📍 {donation.donationName}</h3>
              <p>
                Category: <strong style={{ textTransform: "capitalize" }}>{donation.category}</strong>
                {" · "}Qty: <strong>{donation.quantity}</strong>
              </p>
            </div>

            {/* Cancelled banner */}
            {donation.status === "cancelled" && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#dc2626", fontWeight: 600, fontSize: 14 }}>
                ❌ This donation was cancelled.
              </div>
            )}

            {/* Progress bar */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                <span>Overall Progress</span>
                <span style={{ fontWeight: 700, color: "#10b981" }}>{progressPct}%</span>
              </div>
              <div style={{ height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg,#059669,#10b981,#34d399)",
                  borderRadius: 999,
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>

            {/* Timeline steps */}
            <div className="timeline">
              {STAGE_DEFS.map((stage, idx) => {
                const isCompleted = idx <= completedIdx;
                const isActive = idx === completedIdx && donation.status !== "delivered";
                const isPending = idx > completedIdx;

                // Get date for stage
                let date = null;
                if (idx === 0) date = donation.createdAt;
                if (idx === 2) date = donation.acceptedAt;
                if (idx === 4) date = delivery?.pickedUpAt;
                if (idx === 5) date = donation.deliveredAt || delivery?.deliveredAt;

                return (
                  <div key={stage.key} className="timeline-step">
                    <div className={`timeline-dot ${isCompleted ? "completed" : isActive ? "active" : "pending"}`}>
                      {isCompleted && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {isActive && <div style={{ width: 8, height: 8, background: "#10b981", borderRadius: "50%" }} />}
                    </div>
                    <div className={`timeline-step-title${isPending ? " pending-step" : ""}`}>
                      {stage.icon} {stage.label}
                    </div>
                    {date ? (
                      <div className="timeline-step-date">
                        🕐 {new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    ) : (
                      <div className="timeline-step-date" style={{ fontStyle: "italic", color: "#94a3b8" }}>
                        {isPending ? "Awaiting…" : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* AI Match Info */}
            {donation.matchedOrganization && (
              <div className="timeline-card">
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
                  🤖 AI Match Details
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "Matched NGO", value: donation.matchedOrganization.orgName },
                    { label: "NGO Address", value: donation.matchedOrganization.address },
                    { label: "Requirement", value: donation.matchedRequirement?.title || "—" },
                    { label: "Urgency", value: donation.matchedRequirement?.urgency || "—" },
                    {
                      label: "Match Score",
                      value: donation.matchScore != null ? `${donation.matchScore}%` : "—",
                      highlight: true,
                    },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: 13, color: "#64748b" }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: item.highlight ? "#10b981" : "#1e293b", textTransform: "capitalize" }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Volunteer & Delivery Info */}
            {delivery && (
              <div className="timeline-card">
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
                  🚗 Delivery Info
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "Pickup Address", value: delivery.pickupAddress },
                    { label: "Drop Address", value: delivery.dropAddress },
                    { label: "Scheduled Time", value: delivery.scheduledTime ? new Date(delivery.scheduledTime).toLocaleString("en-IN") : "TBD" },
                    { label: "Status", value: delivery.status?.replace(/_/g, " ") },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: 13, color: "#64748b" }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", textTransform: "capitalize" }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Proof images */}
                {delivery.proofImages?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 10 }}>📷 Delivery Proof</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {delivery.proofImages.map((img, i) => (
                        <img
                          key={i}
                          src={`${BACKEND_URL}/${img}`}
                          alt={`proof-${i}`}
                          style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "2px solid #10b981" }}
                        />
                      ))}
                    </div>
                    {delivery.proofNote && (
                      <p style={{ fontSize: 12, color: "#64748b", marginTop: 8, fontStyle: "italic" }}>
                        Note: {delivery.proofNote}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Donation Image */}
            {donation.image && (
              <div className="timeline-card">
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>
                  📸 Donation Image
                </h3>
                <img
                  src={`${BACKEND_URL}/${donation.image}`}
                  alt="donation"
                  style={{ width: "100%", borderRadius: 12, objectFit: "cover", maxHeight: 200 }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
