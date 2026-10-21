import React from "react";

export default function MatchRecommendationModal({
  isOpen,
  onClose,
  title,
  subtitle,
  recommendations = [],
  loading = false,
  mode = "donor", // "donor" (matching requirements) or "organization" (matching donations)
  onSelectMatch,
  actionLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 780,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(to right, #f8fafc, #ffffff)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🎯</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {title || "Smart Explainable Matches"}
              </h2>
            </div>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 4, margin: 0 }}>
              {subtitle || "Recommendations calculated by our weighted multi-factor compatibility engine."}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              fontSize: 16,
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>
              <p style={{ fontWeight: 600 }}>Calculating compatibility scores & rankings…</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
              <h3 style={{ color: "#1e293b", marginBottom: 6 }}>No Compatible Matches Found</h3>
              <p style={{ color: "#64748b", fontSize: 14, maxWidth: 440, margin: "0 auto" }}>
                {mode === "donor"
                  ? "There are currently no active, verified requirements matching your category and location. Your donation remains pending and will match when a suitable request is posted."
                  : "There are currently no available donor pledges matching this requirement. As soon as a donor posts compatible relief items, they will appear here."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {recommendations.map((item, index) => {
                const score = item.overallScore || 0;
                const factorScores = item.factorScores || {};

                // Determine score badge color
                let scoreColor = "#059669"; // emerald
                let scoreBg = "#ecfdf5";
                let scoreBorder = "#a7f3d0";
                if (score < 60) {
                  scoreColor = "#d97706"; // amber
                  scoreBg = "#fef3c7";
                  scoreBorder = "#fde68a";
                } else if (score < 40) {
                  scoreColor = "#dc2626";
                  scoreBg = "#fee2e2";
                  scoreBorder = "#fca5a5";
                }

                return (
                  <div
                    key={item.requirementId || item.donationId || index}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 16,
                      padding: 20,
                      background: index === 0 ? "#fafcff" : "#ffffff",
                      boxShadow: index === 0 ? "0 4px 20px rgba(2, 132, 199, 0.08)" : "none",
                      position: "relative",
                    }}
                  >
                    {index === 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: -10,
                          left: 20,
                          background: "#0284c7",
                          color: "white",
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 10px",
                          borderRadius: 999,
                          letterSpacing: 0.5,
                          textTransform: "uppercase",
                        }}
                      >
                        ⭐ Best Recommended Match
                      </span>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                            Rank #{index + 1}
                          </span>
                          <span style={{ color: "#cbd5e1" }}>•</span>
                          <span
                            style={{
                              background: "#f1f5f9",
                              color: "#475569",
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          >
                            🏷️ {item.category}
                          </span>
                          {item.urgency && (
                            <span
                              style={{
                                background: item.urgency === "critical" || item.urgency === "high" ? "#fee2e2" : "#fef3c7",
                                color: item.urgency === "critical" || item.urgency === "high" ? "#991b1b" : "#92400e",
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: "capitalize",
                              }}
                            >
                              🚨 {item.urgency} urgency
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                          {item.title || item.donationName}
                        </h4>

                        <div style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
                          {mode === "donor" ? (
                            <>
                              🏢 <strong>{item.organization?.orgName || "Verified Organization"}</strong>
                              {item.location && <span> · 📍 {item.location}</span>}
                            </>
                          ) : (
                            <>
                              👤 <strong>{item.donor?.fullName || "Generous Donor"}</strong>
                              {item.pickupAddress && <span> · 📍 {item.pickupAddress}</span>}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Match Score Circular Pill */}
                      <div
                        style={{
                          background: scoreBg,
                          border: `2px solid ${scoreBorder}`,
                          borderRadius: 16,
                          padding: "10px 16px",
                          textAlign: "center",
                          minWidth: 90,
                        }}
                      >
                        <div style={{ fontSize: 24, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                          {score}%
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: scoreColor, marginTop: 4 }}>
                          MATCH SCORE
                        </div>
                      </div>
                    </div>

                    {/* Factor Breakdown Bars */}
                    {factorScores.category && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                          gap: 10,
                          margin: "14px 0",
                          padding: "12px 14px",
                          background: "#f8fafc",
                          borderRadius: 12,
                          border: "1px solid #edf2f7",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Category Match</div>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13, marginTop: 2 }}>
                            {factorScores.category?.score || 0} / {factorScores.category?.max || 40} pts
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Quantity Coverage</div>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13, marginTop: 2 }}>
                            {factorScores.quantity?.score || 0} / {factorScores.quantity?.max || 20} pts
                            {factorScores.quantity?.coveragePercent != null && (
                              <span style={{ fontSize: 11, color: "#059669", marginLeft: 4 }}>
                                ({factorScores.quantity.coveragePercent}%)
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Proximity Distance</div>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13, marginTop: 2 }}>
                            {factorScores.proximity?.score || 0} / {factorScores.proximity?.max || 20} pts
                            {factorScores.proximity?.distanceKm != null && (
                              <span style={{ fontSize: 11, color: "#0284c7", marginLeft: 4 }}>
                                ({factorScores.proximity.distanceKm} km)
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Urgency & Timeline</div>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13, marginTop: 2 }}>
                            {factorScores.urgencyDeadline?.score || 0} / {factorScores.urgencyDeadline?.max || 20} pts
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Explainable Reasons */}
                    {item.reasons && item.reasons.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                          💡 Why this was recommended:
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {item.reasons.map((reason, rIdx) => (
                            <div
                              key={rIdx}
                              style={{
                                fontSize: 12,
                                color: "#334155",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span style={{ color: "#10b981", fontSize: 14 }}>✔</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => {
                          if (actionLoading) return;
                          if (onSelectMatch) onSelectMatch(item);
                        }}
                        disabled={actionLoading}
                        style={{
                          background: actionLoading ? "#94a3b8" : "#059669",
                          color: "white",
                          border: "none",
                          padding: "9px 18px",
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: actionLoading ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: actionLoading ? "none" : "0 2px 8px rgba(5, 150, 105, 0.25)",
                          opacity: actionLoading ? 0.7 : 1,
                        }}
                      >
                        {actionLoading ? "Processing…" : mode === "donor" ? "🎯 Allocate Donation to this NGO" : "✅ Accept & Connect"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f8fafc",
          }}
        >
          <div style={{ fontSize: 12, color: "#64748b" }}>
            🔒 Safe matching: No automatic reservations. You review and confirm every allocation.
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: "#334155",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
