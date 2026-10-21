import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";
import MatchRecommendationModal from "../../components/common/MatchRecommendationModal";


const CATEGORIES = [
  { id: "food", label: "Food", icon: "🍱", desc: "Meals, dry rations & cooked food" },
  { id: "clothes", label: "Clothes", icon: "👕", desc: "Winter wear, daily clothes & footwear" },
  { id: "books", label: "Educational Materials", icon: "🎒", desc: "Stationery, books & bags" },
  { id: "medicine", label: "Medical Supplies", icon: "🩺", desc: "First aid, medicines & equipment" },
  { id: "essentials", label: "Shelter Essentials", icon: "🛏️", desc: "Blankets, tents, hygiene kits" },
];

const UNITS = ["Packets", "Kg", "Pieces", "Boxes", "Sets", "Liters"];

export default function CreateDonation() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ total: 0, matched: 0, inTransit: 0, delivered: 0 });
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [aiResult, setAiResult] = useState(null);

  // Smart Matching & AI Description States
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [createdDonation, setCreatedDonation] = useState(null);
  const [allocating, setAllocating] = useState(false);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);


  const [form, setForm] = useState({
    category: "food",
    donationName: "",
    quantity: "",
    unit: "Packets",
    pickupAddress: "",
    description: "",
    imagePreview: null,
  });

  // Fetch Stats & User Profile Address
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch My Donations for Stats
        const resDonations = await API.get("/donations/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const donList = resDonations.data.donations || [];
        setStats({
          total: donList.length,
          matched: donList.filter((d) => d.status === "matched").length,
          inTransit: donList.filter((d) => d.status === "picked_up" || d.status === "in_transit").length,
          delivered: donList.filter((d) => d.status === "delivered").length,
        });

        // Fetch User Profile for Pickup Address
        const resProfile = await API.get("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = resProfile.data.user || {};
        const addr = user.address || "";
        if (addr) {
          setRegisteredAddress(addr);
          setForm((f) => ({ ...f, pickupAddress: f.pickupAddress || addr }));
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCategorySelect = (catId) => {
    setForm((f) => ({ ...f, category: catId }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be under 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setForm((f) => ({ ...f, imagePreview: compressedDataUrl }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.donationName.trim()) {
      toast.error("Please enter a donation name.");
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }
    if (!form.pickupAddress.trim()) {
      toast.error("Please enter a pickup address.");
      return;
    }

    setSubmitting(true);
    setAiResult(null);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        category: form.category,
        donationName: form.donationName,
        quantity: Number(form.quantity),
        unit: form.unit,
        pickupAddress: form.pickupAddress,
        description: form.description,
        imageUrl: form.imagePreview || "",
      };

      const res = await API.post("/donations", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const recs = res.data.recommendations || [];
      const newDonation = res.data.donation;
      setCreatedDonation(newDonation);
      setRecommendations(recs);

      const matchInfo = res.data.matchResult || res.data.aiMatch;
      setAiResult(matchInfo);

      if (recs.length > 0) {
        toast.success(`🎯 Donation saved! Found ${recs.length} matching verified requirements.`);
        setShowMatchModal(true);
      } else {
        toast.success("✅ Donation submitted successfully!");
        setTimeout(() => navigate("/donor/my-donations"), 2000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to submit donation.");
    } finally {
      setSubmitting(false);
    }
  };

  // AI Description Assistant Handlers
  const handleAiParse = async () => {
    if (!form.description || form.description.trim().length < 5) {
      toast.info("Please enter a brief description first (e.g. '30 grocery kits containing rice, pulses, and oil for flood victims').");
      return;
    }
    setAiParsing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        "/donations/ai-parse",
        { description: form.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.suggestions) {
        setAiSuggestions(res.data.suggestions);
        toast.success(
          res.data.isAiPowered
            ? "✨ AI (Gemini) extracted structured fields!"
            : "✨ AI Assistant extracted structured fields from description!"
        );
      } else {
        toast.error("Could not extract details from description.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to parse description.");
    } finally {
      setAiParsing(false);
    }
  };

  const handleApplyAiSuggestions = () => {
    if (!aiSuggestions) return;
    setForm((prev) => ({
      ...prev,
      category: aiSuggestions.category || prev.category,
      donationName: aiSuggestions.donationName || prev.donationName,
      quantity: aiSuggestions.quantity || prev.quantity,
      unit: aiSuggestions.unit || prev.unit,
    }));
    toast.success("Applied AI extracted suggestions to form!");
  };

  const handleAllocateMatch = async (matchItem) => {
    if (!createdDonation?._id) return;
    setAllocating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        `/donations/${createdDonation._id}/allocate`,
        { requirementId: matchItem.requirementId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "Donation matched and allocated successfully!");
      setShowMatchModal(false);
      navigate("/donor/my-donations");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to allocate donation.");
    } finally {
      setAllocating(false);
    }
  };

  const selectedCategoryObj = CATEGORIES.find((c) => c.id === form.category) || CATEGORIES[0];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      {/* Top Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
          Pledge & Create Donation
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Submit relief items — our system will match them to priority NGO requirements.
        </p>
      </div>

      {/* Statistics Cards Above Form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div style={{ background: "#ffffff", borderRadius: 16, padding: "20px 22px", borderLeft: "5px solid #059669", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Donated</span>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{stats.total}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ecfdf5", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>🎁</div>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, padding: "20px 22px", borderLeft: "5px solid #0284c7", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Matched</span>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{stats.matched}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#e0f2fe", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>🎯</div>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, padding: "20px 22px", borderLeft: "5px solid #d97706", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>In Transit</span>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{stats.inTransit}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fef3c7", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>🚚</div>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, padding: "20px 22px", borderLeft: "5px solid #16a34a", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Delivered</span>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{stats.delivered}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#dcfce7", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>✅</div>
          </div>
        </div>
      </div>

      {/* Match Result Banner */}
      {aiResult && (
        <div
          style={{
            background: aiResult.matched ? "linear-gradient(135deg,#059669,#10b981)" : "#f1f5f9",
            color: aiResult.matched ? "#ffffff" : "#475569",
            borderRadius: 18,
            padding: "20px 24px",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 4px 20px rgba(16,185,129,0.25)",
          }}
        >
          <div style={{ fontSize: 36 }}>{aiResult.matched ? "🎯" : "⏳"}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              {aiResult.matched
                ? `Match Found!`
                : "Donation Submitted — Pending Match"}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 3 }}>
              {aiResult.matched
                ? `Matched to "${aiResult.bestMatch.title}" at ${aiResult.bestMatch.organizationName} · ${aiResult.bestMatch.distanceKm}km away`
                : "Your donation will be matched when an NGO posts a corresponding requirement."}
            </div>
          </div>
        </div>
      )}

      {/* Main Form Grid (Left) & Summary Panel (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, alignItems: "start" }}>
        <div>
          <form onSubmit={handleSubmit}>
            {/* Category Selection Cards */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 28,
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                marginBottom: 24,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }}></span>
                1. Select Donation Category
              </h3>
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
                Choose the category of items you are donating.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                {CATEGORIES.map((cat) => {
                  const isSelected = form.category === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      style={{
                        padding: 16,
                        borderRadius: 16,
                        border: "2px solid",
                        borderColor: isSelected ? "#059669" : "#e2e8f0",
                        background: isSelected ? "#ecfdf5" : "#ffffff",
                        boxShadow: isSelected ? "0 6px 20px rgba(5,150,105,0.15)" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        position: "relative",
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? "#047857" : "#1e293b" }}>
                        {cat.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{cat.desc}</div>
                      {isSelected && (
                        <span
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "#059669",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Donation Details */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 28,
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                marginBottom: 24,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }}></span>
                2. Donation Item Details
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Donation Name */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label" htmlFor="donationName">
                    Donation Item Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className="form-control"
                    id="donationName"
                    name="donationName"
                    type="text"
                    placeholder="e.g. 50 Packets of Rice & Dry Food Kits"
                    value={form.donationName}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="form-label" htmlFor="quantity">
                    Quantity <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className="form-control"
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={form.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="form-label" htmlFor="unit">
                    Unit Measurement <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    id="unit"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    required
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* Pickup Address */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label className="form-label" htmlFor="pickupAddress" style={{ margin: 0 }}>
                      Pickup Address <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    {registeredAddress && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, pickupAddress: registeredAddress }))}
                        style={{
                          background: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          color: "#059669",
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        🏠 Use Saved Address
                      </button>
                    )}
                  </div>
                  <input
                    className="form-control"
                    id="pickupAddress"
                    name="pickupAddress"
                    type="text"
                    placeholder="e.g. House No. 42, MG Road, Kottayam, Kerala"
                    value={form.pickupAddress}
                    onChange={handleChange}
                    required
                  />
                  {registeredAddress && form.pickupAddress === registeredAddress && (
                    <span style={{ fontSize: 12, color: "#059669", marginTop: 4, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                      ✓ Auto-filled from profile address
                    </span>
                  )}
                </div>

                {/* Description with AI Assistant */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label className="form-label" htmlFor="description" style={{ margin: 0 }}>
                      Item Condition & Special Instructions
                    </label>
                    <button
                      type="button"
                      onClick={handleAiParse}
                      disabled={aiParsing}
                      style={{
                        background: "linear-gradient(135deg, #0284c7, #06b6d4)",
                        color: "#ffffff",
                        border: "none",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "5px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
                      }}
                    >
                      {aiParsing ? "✨ Analyzing…" : "✨ AI Smart Assist: Auto-Fill"}
                    </button>
                  </div>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    placeholder="e.g. 30 grocery kits containing rice, pulses, and cooking oil for flood-affected families…"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                  />

                  {/* AI Suggestions Card */}
                  {aiSuggestions && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 16,
                        borderRadius: 12,
                        background: "#f0f9ff",
                        border: "1px solid #bae6fd",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "#0369a1", fontSize: 13 }}>
                          <span>🤖 AI Extracted Details</span>
                          <span style={{ fontSize: 11, background: "#e0f2fe", color: "#0284c7", padding: "1px 6px", borderRadius: 4 }}>
                            {aiSuggestions.source === "rule-based-nlp-fallback" ? "NLP Classifier" : "AI Powered"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyAiSuggestions}
                          style={{
                            background: "#0284c7",
                            color: "white",
                            border: "none",
                            padding: "4px 12px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ✔ Apply Suggestions
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, fontSize: 12, color: "#334155" }}>
                        <div><strong>Category:</strong> <span style={{ textTransform: "capitalize" }}>{aiSuggestions.category}</span></div>
                        <div><strong>Title:</strong> {aiSuggestions.donationName}</div>
                        <div><strong>Quantity:</strong> {aiSuggestions.quantity} {aiSuggestions.unit}</div>
                        <div><strong>Urgency:</strong> <span style={{ textTransform: "capitalize" }}>{aiSuggestions.suggestedUrgency}</span></div>
                        {aiSuggestions.items?.length > 0 && (
                          <div style={{ gridColumn: "1 / -1" }}>
                            <strong>Items detected:</strong> {aiSuggestions.items.join(", ")}
                          </div>
                        )}
                        {aiSuggestions.beneficiaryContext && (
                          <div style={{ gridColumn: "1 / -1" }}>
                            <strong>Beneficiary context:</strong> {aiSuggestions.beneficiaryContext}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Donation Image Upload */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 28,
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                marginBottom: 24,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }}></span>
                3. Upload Item Photo
              </h3>
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
                Upload photos of your donation items for verification and AI classification.
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: 16,
                  padding: 24,
                  textAlign: "center",
                  background: "#f8fafc",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />

                {form.imagePreview ? (
                  <div>
                    <img
                      src={form.imagePreview}
                      alt="Donation preview"
                      style={{ maxHeight: 180, borderRadius: 12, objectFit: "cover", boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }}
                    />
                    <div style={{ fontSize: 12, color: "#059669", fontWeight: 700, marginTop: 10 }}>
                      ✓ Photo Uploaded & Compressed (Click to Change)
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                      Click or Drag Photo to Upload
                    </div>
                    <span style={{ fontSize: 12, color: "#94a3b8", display: "block", marginTop: 4 }}>
                      Supports JPG, PNG up to 10MB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Recommendation Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #ecfdf5, #f0fdf4)",
                border: "1px solid #a7f3d0",
                borderRadius: 16,
                padding: 20,
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                marginBottom: 28,
              }}
            >
              <div style={{ fontSize: 24 }}>🔄</div>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#047857" }}>
                  Smart Match Guarantee
                </h4>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#065f46", lineHeight: 1.5 }}>
                  Our multi-criteria engine automatically matches your donation against open verified NGO requirements based on urgency, category, quantity, and nearby geographic location.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 14 }}>
              <button
                type="submit"
                className="btn-submit"
                id="submit-donation-btn"
                disabled={submitting}
                style={{ padding: "14px 28px", fontSize: 15, borderRadius: 14, background: "linear-gradient(135deg, #059669, #10b981)" }}
              >
                {submitting ? "🔄 Matching & Submitting…" : "🚀 Submit & Match Donation"}
              </button>
              <button
                type="button"
                className="btn-change-pw"
                onClick={() => navigate("/donor/my-donations")}
                style={{ padding: "14px 24px", fontSize: 15, borderRadius: 14 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Live Summary Sticky Column */}
        <div style={{ position: "sticky", top: 90 }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 24,
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                  Live Donation Summary
                </h4>
                <span style={{ fontSize: 11, color: "#64748b" }}>Real-time preview</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Category</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{selectedCategoryObj.icon}</span>
                  <span>{selectedCategoryObj.label}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Item Name</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  {form.donationName || "Not specified"}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Quantity</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#059669", marginTop: 2 }}>
                  {form.quantity ? `${form.quantity} ${form.unit}` : `0 ${form.unit}`}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Pickup Location</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginTop: 2 }}>
                  📍 {form.pickupAddress || "Address pending"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Match Recommendation Modal */}
      <MatchRecommendationModal
        isOpen={showMatchModal}
        onClose={() => {
          setShowMatchModal(false);
          navigate("/donor/my-donations");
        }}
        title="🎯 Smart Matching Recommendations"
        subtitle={`Top active NGO requirements compatible with your donation of ${createdDonation?.quantity || form.quantity} ${form.unit} of ${form.category}.`}
        recommendations={recommendations}
        mode="donor"
        onSelectMatch={handleAllocateMatch}
        actionLoading={allocating}
      />
    </div>
  );
}
