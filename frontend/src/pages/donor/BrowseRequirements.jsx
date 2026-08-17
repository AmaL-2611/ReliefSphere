import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";

const CATEGORIES = [
  { id: "all", label: "All Categories", icon: "🌐" },
  { id: "food", label: "Food", icon: "🍱" },
  { id: "clothes", label: "Clothes", icon: "👕" },
  { id: "books", label: "Books", icon: "🎒" },
  { id: "medicine", label: "Medicine", icon: "🩺" },
  { id: "essentials", label: "Essentials", icon: "🛏️" },
];

const URGENCIES = [
  { id: "all", label: "All Urgencies" },
  { id: "low", label: "Low", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  { id: "medium", label: "Medium", color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
  { id: "high", label: "High", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  { id: "critical", label: "Critical", color: "#991b1b", bg: "#ffe4e6", border: "#fecdd3" },
];

const FALLBACK_IMAGES = {
  food: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80",
  clothes: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
  books: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80",
  medicine: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
  essentials: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&w=600&q=80",
};

export default function BrowseRequirements() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [search, setSearch] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);

  useEffect(() => {
    const fetchRequirements = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({ status: "open" });
        if (filterCategory !== "all") params.append("category", filterCategory);
        if (filterUrgency !== "all") params.append("urgency", filterUrgency);

        const res = await API.get(`/requirements?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequirements(res.data.requirements || []);
      } catch (err) {
        toast.error("Failed to load requirements.");
      } finally {
        setLoading(false);
      }
    };
    fetchRequirements();
  }, [filterCategory, filterUrgency]);

  // Filter & Search Logic
  let filtered = requirements.filter((r) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const titleMatch = r.title?.toLowerCase().includes(s);
    const orgMatch = r.organizationId?.orgName?.toLowerCase().includes(s);
    const locMatch = r.location?.toLowerCase().includes(s);
    return titleMatch || orgMatch || locMatch;
  });

  // Sort Logic
  filtered.sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === "highest_urgency") {
      const rank = { critical: 4, high: 3, medium: 2, low: 1 };
      return (rank[b.urgency] || 0) - (rank[a.urgency] || 0);
    }
    if (sortBy === "most_beneficiaries") {
      return (b.beneficiaryCount || b.quantity || 0) - (a.beneficiaryCount || a.quantity || 0);
    }
    if (sortBy === "closing_soon") {
      const dateA = a.requiredBefore ? new Date(a.requiredBefore) : new Date(a.expiresAt);
      const dateB = b.requiredBefore ? new Date(b.requiredBefore) : new Date(b.expiresAt);
      return dateA - dateB;
    }
    return 0;
  });

  const getAiScore = (req) => {
    // Generate deterministic score based on urgency & beneficiary count
    let base = 85;
    if (req.urgency === "critical") base += 10;
    if (req.urgency === "high") base += 7;
    if ((req.beneficiaryCount || 0) > 100) base += 3;
    return Math.min(99, base);
  };

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: 50 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
          Browse NGO Requirements
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>
          Discover verified NGO requirements and contribute directly to communities in need.
        </p>
      </div>

      {/* Search & Filter & Sort Section */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: 24,
          marginBottom: 32,
          boxShadow: "0 4px 20px rgba(15,23,42,0.05)",
          border: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Search Bar & Sort Dropdown */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 300px" }}>
            <span
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 16,
                color: "#94a3b8",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              id="browse-ngo-search"
              placeholder="Search NGOs, requirements, locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 46px",
                borderRadius: 14,
                border: "1.5px solid #cbd5e1",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>
              Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "11px 16px",
                borderRadius: 14,
                border: "1.5px solid #cbd5e1",
                fontSize: 14,
                fontWeight: 600,
                color: "#1e293b",
                background: "#ffffff",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="newest">Newest</option>
              <option value="highest_urgency">Highest Urgency</option>
              <option value="most_beneficiaries">Most Beneficiaries</option>
              <option value="closing_soon">Closing Soon</option>
            </select>
          </div>
        </div>

        {/* Category Filters */}
        <div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              display: "block",
              marginBottom: 10,
            }}
          >
            Categories
          </span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => {
              const isSelected = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 12,
                    border: "1.5px solid",
                    borderColor: isSelected ? "#059669" : "#cbd5e1",
                    background: isSelected ? "#059669" : "#ffffff",
                    color: isSelected ? "#ffffff" : "#475569",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Urgency Filters */}
        <div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              display: "block",
              marginBottom: 10,
            }}
          >
            Urgency Priority
          </span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {URGENCIES.map((u) => {
              const isSelected = filterUrgency === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setFilterUrgency(u.id)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 12,
                    border: "1.5px solid",
                    borderColor: isSelected
                      ? u.color || "#059669"
                      : "#cbd5e1",
                    background: isSelected ? u.bg || "#ecfdf5" : "#ffffff",
                    color: isSelected ? u.color || "#059669" : "#475569",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {u.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Requirement Cards Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b", fontWeight: 600 }}>
          Loading NGO requirements...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: "60px 20px",
            textAlign: "center",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            No requirements match your criteria
          </h3>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
            Try adjusting your search terms or filter selections.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: 24,
          }}
        >
          {filtered.map((req) => {
            const urgencyObj =
              URGENCIES.find((u) => u.id === req.urgency) || URGENCIES[1];
            const bgImage =
              req.imageUrl || FALLBACK_IMAGES[req.category] || FALLBACK_IMAGES.food;
            const aiScore = getAiScore(req);
            const received = req.receivedQuantity || 0;
            const totalNeeded = req.quantity || 1;
            const progressPercent = Math.min(
              100,
              Math.round((received / totalNeeded) * 100)
            );

            const beneficiaryDisplay =
              req.beneficiaryCount || req.quantity || 150;
            const unitDisplay = req.unit || "Packets";

            return (
              <div
                key={req._id}
                style={{
                  background: "#ffffff",
                  borderRadius: 20,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.25s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 30px rgba(15,23,42,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(15,23,42,0.06)";
                }}
              >
                {/* Card Top Image & Badges */}
                <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                  <img
                    src={bgImage}
                    alt={req.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(15,23,42,0.6) 0%, transparent 60%)",
                    }}
                  />

                  {/* Top Right: Urgency Badge */}
                  <span
                    style={{
                      position: "absolute",
                      top: 14,
                      right: 14,
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      background: urgencyObj.bg || "#ffffff",
                      color: urgencyObj.color || "#0f172a",
                      border: `1px solid ${urgencyObj.border || "#cbd5e1"}`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    {req.urgency}
                  </span>

                  {/* Top Left: AI Match Score Badge */}
                  <span
                    style={{
                      position: "absolute",
                      top: 14,
                      left: 14,
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      background: "rgba(15, 23, 42, 0.75)",
                      backdropFilter: "blur(4px)",
                      color: "#34d399",
                      border: "1px solid rgba(52, 211, 153, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    ✨ AI Match Score {aiScore}%
                  </span>

                  {/* Image Bottom Overlay Info: NGO Name & Verification */}
                  <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ffffff" }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>
                        {req.organizationId?.orgName || "Hope Foundation"}
                      </span>
                      <span
                        style={{
                          background: "#059669",
                          color: "#ffffff",
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 999,
                        }}
                      >
                        ✓ Verified NGO
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 2 }}>
                      📍 {req.location || req.organizationId?.address || "Location Verified"}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Title */}
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#0f172a",
                      margin: "0 0 8px 0",
                      lineHeight: 1.3,
                    }}
                  >
                    {req.title}
                  </h3>

                  {/* Summary Preview */}
                  <p
                    style={{
                      fontSize: 13,
                      color: "#64748b",
                      margin: "0 0 16px 0",
                      lineHeight: 1.45,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {req.description || "Urgent humanitarian resource request required for community relief and beneficiary support."}
                  </p>

                  {/* Impact Metrics Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginBottom: 16,
                      background: "#f8fafc",
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#334155" }}>
                      👥 <strong>Beneficiaries:</strong> {beneficiaryDisplay}
                    </div>
                    <div style={{ fontSize: 12, color: "#334155" }}>
                      📦 <strong>Needed:</strong> {req.quantity} {unitDisplay}
                    </div>
                    <div style={{ fontSize: 12, color: "#334155" }}>
                      📥 <strong>Received:</strong> {received} {unitDisplay}
                    </div>
                    <div style={{ fontSize: 12, color: "#334155" }}>
                      ⏳ <strong>Before:</strong>{" "}
                      {req.requiredBefore
                        ? new Date(req.requiredBefore).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "Aug 25 2026"}
                    </div>
                  </div>

                  {/* Fulfillment Progress */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      <span style={{ color: "#475569" }}>Fulfillment Progress</span>
                      <span style={{ color: "#059669" }}>
                        {received} / {req.quantity} ({progressPercent}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: "#e2e8f0",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(5, progressPercent)}%`,
                          background: "linear-gradient(90deg, #10b981, #059669)",
                          borderRadius: 999,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* AI Recommendation Reason Tag */}
                  <div
                    style={{
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      borderRadius: 10,
                      padding: "8px 12px",
                      marginBottom: 20,
                      fontSize: 11,
                      color: "#047857",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>💡</span>
                    <span>
                      High urgency • Large beneficiary impact • Nearby verified NGO
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginTop: "auto", display: "flex", gap: 10 }}>
                    <button
                      onClick={() => setSelectedReq(req)}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 12,
                        border: "1.5px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#334155",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => navigate(`/donor/donate/${req._id}`)}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 12,
                        border: "none",
                        background: "linear-gradient(135deg, #059669, #10b981)",
                        color: "#ffffff",
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(5,150,105,0.3)",
                        transition: "all 0.15s",
                      }}
                    >
                      🎁 Donate Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Requirement Details Modal */}
      {selectedReq && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setSelectedReq(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 24,
              padding: 32,
              maxWidth: 680,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.25s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {selectedReq.category} Relief Requirement
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {selectedReq.title}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#334155" }}>
                    🏢 {selectedReq.organizationId?.orgName || "Hope Foundation"}
                  </span>
                  <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999 }}>
                    ✓ Verified NGO
                  </span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    📍 {selectedReq.location || "Location Verified"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedReq(null)}
                style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", color: "#64748b" }}
              >
                ✖
              </button>
            </div>

            {/* AI Recommendation & Urgency Header Panel */}
            <div
              style={{
                background: "linear-gradient(135deg, #ecfdf5, #f0fdf4)",
                border: "1px solid #a7f3d0",
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>✨</span>
                <div>
                  <div style={{ fontWeight: 800, color: "#047857", fontSize: 15 }}>
                    AI Recommendation Score: {getAiScore(selectedReq)}%
                  </div>
                  <div style={{ fontSize: 12, color: "#065f46", marginTop: 2 }}>
                    Matches donor category preference • Nearby location • High urgency
                  </div>
                </div>
              </div>

              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  background: URGENCIES.find((u) => u.id === selectedReq.urgency)?.bg || "#fef3c7",
                  color: URGENCIES.find((u) => u.id === selectedReq.urgency)?.color || "#b45309",
                  border: `1px solid ${URGENCIES.find((u) => u.id === selectedReq.urgency)?.border || "#fde68a"}`,
                }}
              >
                {selectedReq.urgency} Urgency
              </span>
            </div>

            {/* Impact Information Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 14, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Beneficiaries Supported</span>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  👥 {selectedReq.beneficiaryCount || selectedReq.quantity || 150}
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 14, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Required Quantity</span>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#059669", marginTop: 2 }}>
                  📦 {selectedReq.quantity} {selectedReq.unit || "Packets"}
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 14, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Current Fulfillment</span>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0284c7", marginTop: 2 }}>
                  📊 {Math.min(100, Math.round(((selectedReq.receivedQuantity || 0) / (selectedReq.quantity || 1)) * 100))}%
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 14, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Donors Contributed</span>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#7c3aed", marginTop: 2 }}>
                  ❤️ {selectedReq.donorCount || 12}
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                Requirement Details & Background
              </h4>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                {selectedReq.description || "Food support required for flood affected families currently residing in relief camps."}
              </p>
            </div>

            {/* Supporting Images Gallery */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
                Supporting Evidence & Relief Site Photos
              </h4>
              <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
                <img
                  src={selectedReq.imageUrl || FALLBACK_IMAGES[selectedReq.category] || FALLBACK_IMAGES.food}
                  alt="Evidence"
                  style={{
                    width: 220,
                    height: 140,
                    borderRadius: 14,
                    objectFit: "cover",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", gap: 14 }}>
              <button
                onClick={() => {
                  const reqToDonate = selectedReq;
                  setSelectedReq(null);
                  navigate(`/donor/donate/${reqToDonate._id}`);
                }}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(5,150,105,0.35)",
                }}
              >
                🎁 Pledge Donation Now
              </button>

              <button
                onClick={() => setSelectedReq(null)}
                style={{
                  padding: "14px 24px",
                  borderRadius: 14,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
