import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";

const CATEGORIES = [
  { id: "food", label: "Food", icon: "🍱", desc: "Meals, dry rations & cooked food" },
  { id: "clothes", label: "Clothes", icon: "👕", desc: "Winter wear, daily clothes & footwear" },
  { id: "books", label: "Educational Materials", icon: "🎒", desc: "Stationery, books & bags" },
  { id: "medicine", label: "Medical Supplies", icon: "🩺", desc: "First aid, medicines & equipment" },
  { id: "essentials", label: "Shelter Essentials", icon: "🛏️", desc: "Blankets, tents, hygiene kits" },
];

const BENEFICIARY_TYPES = [
  "Children",
  "Women",
  "Senior Citizens",
  "Disaster Victims",
  "Homeless",
  "General Community",
];

const UNITS = ["Packets", "Kg", "Pieces", "Boxes", "Sets", "Liters"];

const URGENCIES = [
  { id: "low", label: "Low", icon: "🟢", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  { id: "medium", label: "Medium", icon: "🟡", color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
  { id: "high", label: "High", icon: "🔴", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  { id: "critical", label: "Critical", icon: "🚨", color: "#991b1b", bg: "#ffe4e6", border: "#fecdd3" },
];

export default function CreateRequirement() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ open: 0, pending: 0, matched: 0, fulfilled: 0 });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [form, setForm] = useState({
    category: "food",
    title: "",
    quantity: "",
    unit: "Packets",
    beneficiaryType: "Disaster Victims",
    beneficiaryCount: "",
    requiredBefore: "",
    urgency: "medium",
    location: "",
    description: "",
    imagePreview: null,
  });

  const [registeredAddress, setRegisteredAddress] = useState("");

  // Fetch Stats & Organization Profile Registered Address
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/requirements/org/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.stats) {
          setStats(res.data.stats);
        }

        // Fetch User Profile for Registered Address
        const resProfile = await API.get("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userObj = resProfile.data.user || {};
        const roleDetails = resProfile.data.roleDetails || {};
        let addr = roleDetails.address || userObj.address || "";

        // Fallback to latest posted requirement location if profile address is empty
        if (!addr && res.data?.requirements?.length > 0) {
          addr = res.data.requirements[0].location || "";
        }

        if (addr) {
          setRegisteredAddress(addr);
          setForm((f) => ({ ...f, location: addr }));
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

  const handleUrgencySelect = (urgencyId) => {
    setForm((f) => ({ ...f, urgency: urgencyId }));
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

          // Compress to JPEG at 0.7 quality (~50KB)
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
    if (!form.title.trim()) {
      toast.error("Please enter a requirement title.");
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }
    if (!form.location.trim()) {
      toast.error("Please enter a delivery location.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        category: form.category,
        title: form.title,
        quantity: form.quantity,
        unit: form.unit,
        beneficiaryType: form.beneficiaryType,
        beneficiaryCount: form.beneficiaryCount,
        requiredBefore: form.requiredBefore,
        urgency: form.urgency,
        location: form.location,
        description: form.description,
        imageUrl: form.imagePreview || "",
      };

      await API.post("/requirements", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowSuccessModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to post requirement.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryObj = CATEGORIES.find((c) => c.id === form.category) || CATEGORIES[0];
  const selectedUrgencyObj = URGENCIES.find((u) => u.id === form.urgency) || URGENCIES[1];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      {/* Top Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
          Resource Requirement Management
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Post and manage humanitarian relief requests for verified beneficiaries.
        </p>
      </div>

      {/* 1. Statistics Cards Above Form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Open Requests */}
        <div
          className="stat-hover-card"
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "20px 22px",
            borderLeft: "5px solid #0891b2",
            border: "1px solid #e2e8f0",
            borderLeftWidth: 5,
            boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
            transition: "all 0.25s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Open Requests
              </span>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                {stats.open || 0}
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#ecfeff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              📋
            </div>
          </div>
        </div>

        {/* Pending Approval */}
        <div
          className="stat-hover-card"
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "20px 22px",
            borderLeft: "5px solid #d97706",
            border: "1px solid #e2e8f0",
            borderLeftWidth: 5,
            boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
            transition: "all 0.25s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Pending Approval
              </span>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                {stats.pending || 0}
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              ⏳
            </div>
          </div>
        </div>

        {/* Matched Requests */}
        <div
          className="stat-hover-card"
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "20px 22px",
            borderLeft: "5px solid #2563eb",
            border: "1px solid #e2e8f0",
            borderLeftWidth: 5,
            boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
            transition: "all 0.25s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Matched Requests
              </span>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                {stats.matched || 0}
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              🤝
            </div>
          </div>
        </div>

        {/* Completed Requests */}
        <div
          className="stat-hover-card"
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "20px 22px",
            borderLeft: "5px solid #059669",
            border: "1px solid #e2e8f0",
            borderLeftWidth: 5,
            boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
            transition: "all 0.25s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Completed Requests
              </span>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                {stats.fulfilled || 0}
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              ✅
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form (Left) & Real-time Live Summary Panel (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, alignItems: "start" }}>
        {/* Form Container */}
        <div>
          <form onSubmit={handleSubmit}>
            {/* Form Section 1: Resource Category */}
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
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0891b2" }}></span>
                1. Select Resource Category
              </h3>
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
                Choose the primary category of supplies required for this relief effort.
              </p>

              {/* 2. Category Selection Cards */}
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
                        borderColor: isSelected ? "#0891b2" : "#e2e8f0",
                        background: isSelected ? "#f0fdfa" : "#ffffff",
                        boxShadow: isSelected ? "0 6px 20px rgba(8,145,178,0.15)" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        position: "relative",
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? "#0e7490" : "#1e293b" }}>
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
                            background: "#0891b2",
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

            {/* Form Section 2: Requirement & Beneficiary Information */}
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
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0891b2" }}></span>
                2. Requirement & Beneficiary Details
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
                {/* Title */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="org-label" htmlFor="title">
                    Requirement Title <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className="org-input"
                    id="title"
                    name="title"
                    type="text"
                    placeholder="e.g. 150 Hot Meal Kits for Flood Affected Families"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* 3. Beneficiary Type */}
                <div>
                  <label className="org-label" htmlFor="beneficiaryType">
                    Beneficiary Type <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    className="org-select"
                    id="beneficiaryType"
                    name="beneficiaryType"
                    value={form.beneficiaryType}
                    onChange={handleChange}
                    required
                  >
                    {BENEFICIARY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Number of Beneficiaries */}
                <div>
                  <label className="org-label" htmlFor="beneficiaryCount">
                    Number of Beneficiaries <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className="org-input"
                    id="beneficiaryCount"
                    name="beneficiaryCount"
                    type="number"
                    min="1"
                    placeholder="e.g. 150"
                    value={form.beneficiaryCount}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* 4. Quantity & Unit */}
                <div>
                  <label className="org-label" htmlFor="quantity">
                    Quantity Needed <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className="org-input"
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={form.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="org-label" htmlFor="unit">
                    Unit Measurement <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    className="org-select"
                    id="unit"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    required
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Required Before Date */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="org-label" htmlFor="requiredBefore">
                    Required Before (Target Date) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className="org-input"
                    id="requiredBefore"
                    name="requiredBefore"
                    type="date"
                    value={form.requiredBefore}
                    onChange={handleChange}
                    required
                  />
                  <span style={{ fontSize: 12, color: "#64748b", marginTop: 4, display: "block" }}>
                    Helps donors understand urgency and delivery timelines.
                  </span>
                </div>
              </div>
            </div>

            {/* Form Section 3: Urgency & Delivery Location */}
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
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0891b2" }}></span>
                3. Urgency & Location
              </h3>

              {/* 6. Urgency Priority Pills */}
              <div style={{ marginBottom: 20 }}>
                <label className="org-label" style={{ marginBottom: 8, display: "block" }}>
                  Urgency Priority Level <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
                  {URGENCIES.map((u) => {
                    const isSelected = form.urgency === u.id;
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => handleUrgencySelect(u.id)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 14,
                          border: "2px solid",
                          borderColor: isSelected ? u.color : "#e2e8f0",
                          background: isSelected ? u.bg : "#ffffff",
                          color: isSelected ? u.color : "#475569",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          boxShadow: isSelected ? `0 4px 14px ${u.color}33` : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <span>{u.icon}</span>
                        <span>{u.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="org-label" htmlFor="location" style={{ margin: 0 }}>
                    Delivery Location / Relief Camp Address <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  {registeredAddress && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, location: registeredAddress }))}
                      style={{
                        background: "#ecfeff",
                        border: "1px solid #a5f3fc",
                        color: "#0891b2",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      🏠 Use Registered Address
                    </button>
                  )}
                </div>
                <input
                  className="org-input"
                  id="location"
                  name="location"
                  type="text"
                  placeholder="e.g. St. Joseph Shelter Camp, District Relief Zone 4, Trivandrum"
                  value={form.location}
                  onChange={handleChange}
                  required
                />
                {registeredAddress && form.location === registeredAddress && (
                  <span style={{ fontSize: 12, color: "#059669", marginTop: 4, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                    ✓ Auto-filled from registered organization address
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="org-label" htmlFor="description">
                  Detailed Specifications & Logistics Context
                </label>
                <textarea
                  className="org-textarea"
                  id="description"
                  name="description"
                  placeholder="Specify beneficiary age groups, packaging instructions, storage facilities available…"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            {/* Form Section 4: 7. Supporting Evidence Upload */}
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
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0891b2" }}></span>
                4. Upload Supporting Image / Evidence
              </h3>
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
                Upload photos of shelter, classroom, storage room, beneficiaries, or request evidence to build donor trust.
              </p>

              <div
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
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    cursor: "pointer",
                    width: "100%",
                    height: "100%",
                  }}
                />

                {form.imagePreview ? (
                  <div>
                    <img
                      src={form.imagePreview}
                      alt="Supporting Evidence"
                      style={{ maxHeight: 180, borderRadius: 12, objectFit: "cover", boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }}
                    />
                    <div style={{ fontSize: 12, color: "#059669", fontWeight: 700, marginTop: 10 }}>
                      ✓ Image Uploaded Successfully (Click to Change)
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                      Drag & Drop or Click to Upload Supporting Photos
                    </div>
                    <span style={{ fontSize: 12, color: "#94a3b8", display: "block", marginTop: 4 }}>
                      Supports JPG, PNG, WEBP up to 5MB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 9. AI Recommendation Notice */}
            <div
              style={{
                background: "linear-gradient(135deg, #e0f2fe, #f0f9ff)",
                border: "1px solid #bae6fd",
                borderRadius: 16,
                padding: 20,
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "#0284c7",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(2,132,199,0.3)",
                }}
              >
                💡
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0369a1" }}>
                  AI Matching Insight
                </h4>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#0c4a6e", lineHeight: 1.5 }}>
                  Requirements with complete beneficiary details, location information, and supporting evidence receive donations faster and achieve higher matching accuracy.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 14 }}>
              <button
                type="submit"
                className="org-btn-primary"
                id="publish-requirement-btn"
                disabled={submitting}
                style={{ padding: "14px 28px", fontSize: 15, borderRadius: 14 }}
              >
                {submitting ? "Publishing Request…" : "🚀 Publish Requirement"}
              </button>
              <button
                type="button"
                className="org-btn-secondary"
                onClick={() => navigate("/organization/my-requirements")}
                style={{ padding: "14px 24px", fontSize: 15, borderRadius: 14 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* 8. Live Requirement Summary Panel (Sticky Right Column) */}
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
                  Live Requirement Summary
                </h4>
                <span style={{ fontSize: 11, color: "#64748b" }}>Real-time preview</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
              {/* Category */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Category</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{selectedCategoryObj.icon}</span>
                  <span>{selectedCategoryObj.label}</span>
                </div>
              </div>

              {/* Beneficiary Type */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Beneficiary Type</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  👥 {form.beneficiaryType}
                </div>
              </div>

              {/* Beneficiary Count */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Beneficiary Count</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  {form.beneficiaryCount ? `${form.beneficiaryCount} Beneficiaries` : "Not specified"}
                </div>
              </div>

              {/* Quantity & Unit */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Quantity</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0891b2", marginTop: 2 }}>
                  {form.quantity ? `${form.quantity} ${form.unit}` : `0 ${form.unit}`}
                </div>
              </div>

              {/* Urgency */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Urgency</span>
                <div style={{ marginTop: 4 }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                      background: selectedUrgencyObj.bg,
                      color: selectedUrgencyObj.color,
                      border: `1px solid ${selectedUrgencyObj.border}`,
                    }}
                  >
                    {selectedUrgencyObj.icon} {selectedUrgencyObj.label} Priority
                  </span>
                </div>
              </div>

              {/* Required Before */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Required Before</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginTop: 2 }}>
                  📅 {form.requiredBefore ? new Date(form.requiredBefore).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Target date pending"}
                </div>
              </div>
            </div>

            {/* Organization Verification Stamp */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #e2e8f0", textAlign: "center" }}>
              <span style={{ fontSize: 11, color: "#059669", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                🛡️ Platform Verified Organization Post
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 10. Better Status Flow: Success Modal */}
      {showSuccessModal && (
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
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 24,
              padding: 36,
              maxWidth: 460,
              width: "90%",
              textAlign: "center",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.3s ease-out",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#dcfce7",
                color: "#16a34a",
                fontSize: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              🎉
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
              Requirement Submitted Successfully
            </h3>

            <div style={{ margin: "14px 0" }}>
              <span style={{ background: "#fef3c7", color: "#b45309", padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "1px solid #fde68a" }}>
                Status: Pending Admin Approval ⏳
              </span>
            </div>

            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
              Your request will become visible to donors after verification by the platform administrator.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="org-btn-primary"
                onClick={() => navigate("/organization/my-requirements")}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, fontSize: 14 }}
              >
                Go to My Requirements
              </button>
              <button
                className="org-btn-secondary"
                onClick={() => {
                  setShowSuccessModal(false);
                  setForm({
                    category: "food",
                    title: "",
                    quantity: "",
                    unit: "Packets",
                    beneficiaryType: "Disaster Victims",
                    beneficiaryCount: "",
                    requiredBefore: "",
                    urgency: "medium",
                    location: "",
                    description: "",
                    imagePreview: null,
                  });
                }}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, fontSize: 14 }}
              >
                Post Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
