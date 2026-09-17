import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";

const URGENCY_BADGES = {
  Low: { label: "Low Urgency", bg: "#f0fdf4", color: "#16a34a" },
  Medium: { label: "Medium Urgency", bg: "#fffbeb", color: "#d97706" },
  High: { label: "High Urgency", bg: "#fef2f2", color: "#dc2626" },
  Critical: { label: "Critical Priority", bg: "#ffe4e6", color: "#991b1b" },
};

const DISASTER_FILTERS = [
  "All",
  "Flood",
  "Landslide",
  "Cyclone",
  "Earthquake",
  "Fire Accident",
  "Medical Emergency",
  "Community Crisis",
  "Other",
];

export default function BrowseCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisaster, setSelectedDisaster] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await API.get("/campaigns/public");
      if (res.data.success) {
        setCampaigns(res.data.campaigns || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load public relief campaigns.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesDisaster =
      selectedDisaster === "All" || c.disasterType === selectedDisaster;
    const matchesSearch =
      search.trim() === "" ||
      (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.organizationId?.orgName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.reliefGoal || "").toLowerCase().includes(search.toLowerCase());
    return matchesDisaster && matchesSearch;
  });

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Humanitarian Emergency Response
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
          Emergency Relief Campaigns 🚨
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Support verified Community Shelter disaster response drives and donate essential relief kits.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {/* Disaster Type Pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DISASTER_FILTERS.map((df) => (
            <button
              key={df}
              onClick={() => setSelectedDisaster(df)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: selectedDisaster === df ? "#059669" : "#f1f5f9",
                color: selectedDisaster === df ? "#fff" : "#475569",
                transition: "all 0.2s",
              }}
            >
              {df}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search campaign, shelter, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            minWidth: 260,
          }}
        />
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
          Loading emergency relief campaigns…
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            No Active Relief Campaigns Found
          </h3>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            There are currently no active disaster relief campaigns matching your filter.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            gap: 24,
          }}
        >
          {filteredCampaigns.map((camp) => {
            const urgencyBadge = URGENCY_BADGES[camp.urgency] || URGENCY_BADGES.Medium;
            const progressPct = camp.targetQuantity > 0
              ? Math.min(100, Math.round(((camp.raisedQuantity || 0) / camp.targetQuantity) * 100))
              : 0;

            const orgName = camp.organizationId?.orgName || "Verified Community Shelter";

            return (
              <div
                key={camp._id}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid #e2e8f0",
                }}
              >
                {/* Image Banner & Badges */}
                <div style={{ position: "relative", height: 180, background: "#f8fafc" }}>
                  {camp.coverImage ? (
                    <img
                      src={camp.coverImage.startsWith("http") ? camp.coverImage : `http://localhost:5000/${camp.coverImage}`}
                      alt={camp.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(135deg, #059669, #047857)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 48,
                        color: "#fff",
                      }}
                    >
                      🚨
                    </div>
                  )}

                  {/* Urgency Badge */}
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      background: urgencyBadge.bg,
                      color: urgencyBadge.color,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                    }}
                  >
                    {urgencyBadge.label}
                  </span>

                  {/* Verified Community Shelter Badge */}
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      background: "rgba(15, 23, 42, 0.85)",
                      color: "#38bdf8",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    ✓ Verified Community Shelter
                  </span>
                </div>

                {/* Card Content */}
                <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                    {camp.disasterType || "Disaster"} • <span style={{ color: "#0284c7" }}>{camp.reliefGoal || camp.category}</span>
                  </div>

                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: "#0f172a",
                      lineHeight: 1.4,
                      marginBottom: 8,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {camp.title}
                  </h3>

                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🏢 {orgName}</span>
                    <span>•</span>
                    <span>📍 {camp.location}</span>
                  </div>

                  {/* Impact Stats Pill */}
                  <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-around", fontSize: 12, fontWeight: 700 }}>
                    <div style={{ color: "#059669" }}>👥 {camp.affectedPeopleCount || 0} Affected People</div>
                    <div style={{ color: "#0284c7" }}>🏠 {camp.affectedFamiliesCount || 0} Families</div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginTop: "auto", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      <span>Progress ({progressPct}%)</span>
                      <span>{camp.raisedQuantity || 0} / {camp.targetQuantity || 0} Kits</span>
                    </div>
                    <div style={{ height: 8, width: "100%", background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${progressPct}%`,
                          background: "linear-gradient(90deg, #059669, #10b981)",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 10 }}>
                    <button
                      onClick={() => setSelectedCampaign(camp)}
                      style={{
                        padding: "10px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        color: "#334155",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => navigate(`/donor/donate-campaign/${camp._id}`)}
                      style={{
                        padding: "10px",
                        borderRadius: 8,
                        border: "none",
                        background: "linear-gradient(135deg, #059669, #047857)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                      }}
                    >
                      Donate Supplies 🎁
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 720,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#dc2626" }}>
                  {selectedCampaign.disasterType} Relief Drive • {selectedCampaign.reliefGoal}
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                  {selectedCampaign.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {selectedCampaign.coverImage && (
              <img
                src={selectedCampaign.coverImage.startsWith("http") ? selectedCampaign.coverImage : `http://localhost:5000/${selectedCampaign.coverImage}`}
                alt={selectedCampaign.title}
                style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 12, marginBottom: 20 }}
              />
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "#f8fafc", padding: 16, borderRadius: 12, fontSize: 13, marginBottom: 20 }}>
              <div><strong>Community Shelter:</strong> {selectedCampaign.organizationId?.orgName || "Shelter"}</div>
              <div><strong>Location:</strong> {selectedCampaign.location}</div>
              <div><strong>Affected People:</strong> {selectedCampaign.affectedPeopleCount || 0} Count</div>
              <div><strong>Affected Families:</strong> {selectedCampaign.affectedFamiliesCount || 0} Families</div>
              <div><strong>Target Supplies:</strong> {selectedCampaign.targetQuantity || 0} Kits</div>
              <div><strong>Estimated Budget:</strong> ₹{(selectedCampaign.estimatedBudget || 0).toLocaleString("en-IN")}</div>
              <div><strong>Coordinator:</strong> {selectedCampaign.coordinatorName || "N/A"} ({selectedCampaign.coordinatorContact || "N/A"})</div>
              <div><strong>Campaign Duration:</strong> {new Date(selectedCampaign.startDate).toLocaleDateString("en-IN")} - {new Date(selectedCampaign.endDate).toLocaleDateString("en-IN")}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 6 }}>Relief Mission Summary</div>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {selectedCampaign.description || "No detailed summary provided."}
              </p>
            </div>

            {selectedCampaign.distributionPlan && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 6 }}>Relief Distribution Plan</div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, background: "#f1f5f9", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>
                  {selectedCampaign.distributionPlan}
                </div>
              </div>
            )}

            {selectedCampaign.evidenceFiles && selectedCampaign.evidenceFiles.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 8 }}>
                  Official Authorization & Supporting Proof ({selectedCampaign.evidenceFiles.length})
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {selectedCampaign.evidenceFiles.map((file, idx) => {
                    const fileUrl = file.startsWith("http") ? file : `http://localhost:5000/${file}`;
                    return (
                      <a
                        key={idx}
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "#e0f2fe",
                          color: "#0369a1",
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        📄 Evidence Document #{idx + 1}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setSelectedCampaign(null)}
                style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer" }}
              >
                Close
              </button>

              <button
                onClick={() => {
                  const id = selectedCampaign._id;
                  setSelectedCampaign(null);
                  navigate(`/donor/donate-campaign/${id}`);
                }}
                style={{
                  padding: "10px 22px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #059669, #047857)",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                }}
              >
                Pledge Supplies Now 🎁
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
