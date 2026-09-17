import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";

const DISASTER_TYPES = [
  "Flood",
  "Landslide",
  "Cyclone",
  "Earthquake",
  "Fire Accident",
  "Medical Emergency",
  "Community Crisis",
  "Other",
];

const RELIEF_GOALS = [
  "Food Kits",
  "Medicines",
  "Blankets",
  "Hygiene Kits",
  "Shelter Materials",
  "School Kits",
  "Mixed Relief Supplies",
];

const URGENCIES = [
  { value: "Low", label: "Low Urgency", color: "#16a34a", bg: "#f0fdf4" },
  { value: "Medium", label: "Medium Urgency", color: "#d97706", bg: "#fffbeb" },
  { value: "High", label: "High Urgency", color: "#dc2626", bg: "#fef2f2" },
  { value: "Critical", label: "Critical Priority", color: "#991b1b", bg: "#ffe4e6" },
];

export default function CreateCampaign() {
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split("T")[0];
  const nextMonthStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [formData, setFormData] = useState({
    title: "",
    disasterType: "Flood",
    reliefGoal: "Food Kits",
    description: "",
    affectedPeopleCount: "",
    affectedFamiliesCount: "",
    coordinatorName: "",
    coordinatorContact: "",
    distributionPlan: "",
    estimatedBudget: "",
    targetQuantity: "",
    location: "",
    startDate: todayStr,
    endDate: nextMonthStr,
    urgency: "High",
  });

  const [orgInfo, setOrgInfo] = useState({ name: "Community Shelter", type: "community_shelter" });
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [allowedOrg, setAllowedOrg] = useState(true);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  // Check org eligibility & prefill coordinator info & shelter registered address
  useEffect(() => {
    const fetchOrgProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = res.data.user || {};
        const roleDetails = res.data.roleDetails || {};
        const orgType = roleDetails.orgType;

        if (orgType && orgType !== "community_shelter") {
          setAllowedOrg(false);
        }

        setOrgInfo({
          name: roleDetails.orgName || user.fullName || "Community Shelter",
          type: orgType || "community_shelter",
        });

        setFormData((prev) => ({
          ...prev,
          coordinatorName: prev.coordinatorName || user.fullName || "",
          coordinatorContact: prev.coordinatorContact || user.phone || "",
          location: prev.location || roleDetails.address || user.address || "",
        }));
      } catch (err) {
        console.error("Failed to verify org eligibility:", err);
      } finally {
        setCheckingEligibility(false);
      }
    };
    fetchOrgProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Detect My Location via Browser Geolocation + OpenStreetMap Reverse Geocoding
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
            { headers: { "User-Agent": "ReliefSphere/1.0" } }
          );
          const data = await res.json();
          const placeName = data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          setFormData((prev) => ({ ...prev, location: placeName }));
          toast.success("📍 Location detected successfully!");
        } catch {
          const coordsStr = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          setFormData((prev) => ({ ...prev, location: coordsStr }));
          toast.info("📍 Location coordinates detected.");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        toast.error("Could not fetch location. Please enter location manually.");
        setDetectingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Cover image size must be under 10MB");
        return;
      }
      setCoverImageFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleEvidenceChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error("You can upload a maximum of 5 evidence files.");
      return;
    }
    setEvidenceFiles(files);
  };

  const submitCampaign = async (isDraft = false) => {
    // Validation Rules
    if (!isDraft) {
      if (!formData.title.trim()) return toast.error("Campaign Title is required.");
      if (!formData.location.trim()) return toast.error("Location is required.");
      if (!formData.coordinatorName.trim() || !formData.coordinatorContact.trim()) {
        return toast.error("Coordinator Name & Contact Number are required.");
      }
      if (Number(formData.affectedPeopleCount) <= 0) {
        return toast.error("Affected People Count must be greater than 0.");
      }
      if (Number(formData.affectedFamiliesCount) <= 0) {
        return toast.error("Affected Families Count must be greater than 0.");
      }
      if (!formData.startDate || !formData.endDate) {
        return toast.error("Campaign Start Date and End Date are required.");
      }

      const todayZero = new Date();
      todayZero.setHours(0, 0, 0, 0);
      const startD = new Date(formData.startDate);
      const endD = new Date(formData.endDate);

      if (startD < todayZero) {
        return toast.error("Campaign Start Date cannot be in the past.");
      }
      if (endD < startD) {
        return toast.error("Campaign End Date must be on or after Start Date.");
      }
      if (evidenceFiles.length === 0 && !coverImageFile) {
        return toast.error("At least one supporting document or evidence file is required.");
      }
    }

    if (isDraft) setSavingDraft(true);
    else setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const data = new FormData();

      data.append("title", formData.title);
      data.append("disasterType", formData.disasterType);
      data.append("reliefGoal", formData.reliefGoal);
      data.append("description", formData.description);
      data.append("affectedPeopleCount", formData.affectedPeopleCount || "0");
      data.append("affectedFamiliesCount", formData.affectedFamiliesCount || "0");
      data.append("coordinatorName", formData.coordinatorName);
      data.append("coordinatorContact", formData.coordinatorContact);
      data.append("distributionPlan", formData.distributionPlan);
      data.append("estimatedBudget", formData.estimatedBudget || "0");
      data.append("targetQuantity", formData.targetQuantity || "0");
      data.append("location", formData.location);
      data.append("startDate", formData.startDate);
      data.append("endDate", formData.endDate);
      data.append("urgency", formData.urgency);
      data.append("isDraft", isDraft ? "true" : "false");

      if (coverImageFile) {
        data.append("coverImage", coverImageFile);
      }

      evidenceFiles.forEach((file) => {
        data.append("evidenceFiles", file);
      });

      const res = await API.post("/campaigns", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        res.data.message ||
          (isDraft
            ? "Campaign saved as Draft!"
            : "Humanitarian Relief Campaign submitted! Pending Admin approval.")
      );

      setTimeout(() => navigate("/organization/my-campaigns"), 1500);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to submit campaign."
      );
    } finally {
      setSubmitting(false);
      setSavingDraft(false);
    }
  };

  if (checkingEligibility) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
        Verifying relief portal permissions…
      </div>
    );
  }

  if (!allowedOrg) {
    return (
      <div
        className="org-card"
        style={{
          textAlign: "center",
          padding: 40,
          maxWidth: 600,
          margin: "40px auto",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>
          Campaign Access Restricted
        </h2>
        <p style={{ color: "#64748b", marginTop: 8, lineHeight: 1.6 }}>
          Humanitarian campaigns are reserved for <strong>Community Shelters</strong> and Emergency Relief Orgs. Orphanages and Old-Age Homes use the Requirement Module for daily needs.
        </p>
        <button
          className="org-btn-primary"
          style={{ marginTop: 20 }}
          onClick={() => navigate("/organization/create-requirement")}
        >
          ➕ Post Resource Requirement
        </button>
      </div>
    );
  }

  const urgencyBadge = URGENCIES.find((u) => u.value === formData.urgency) || URGENCIES[2];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            UN Relief & Red Cross Aligned System
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
            Launch Emergency Relief Campaign 🚨
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Create an official disaster relief campaign for public resource mobilization and volunteer logistics.
          </p>
        </div>

        <button
          className="org-btn-secondary"
          onClick={() => navigate("/organization/my-campaigns")}
        >
          ← My Campaigns Directory
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 28, alignItems: "start" }}>
        {/* Left Column: Form Fields */}
        <div className="org-card" style={{ padding: 28 }}>
          <form onSubmit={(e) => { e.preventDefault(); submitCampaign(false); }}>
            
            {/* Section 1: Disaster Identification */}
            <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span>1. Disaster & Event Identification</span>
              </div>

              <div className="org-form-grid">
                {/* Campaign Title */}
                <div className="org-form-group full-width">
                  <label className="org-label">
                    Campaign Title <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="org-input"
                    placeholder="e.g. Wayanad Landslide Emergency Relief Drive 2026"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Disaster/Event Type */}
                <div className="org-form-group">
                  <label className="org-label">
                    Disaster / Event Type <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    name="disasterType"
                    className="org-input"
                    value={formData.disasterType}
                    onChange={handleChange}
                    required
                  >
                    {DISASTER_TYPES.map((dt) => (
                      <option key={dt} value={dt}>
                        {dt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Relief Goal */}
                <div className="org-form-group">
                  <label className="org-label">
                    Primary Relief Goal <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    name="reliefGoal"
                    className="org-input"
                    value={formData.reliefGoal}
                    onChange={handleChange}
                    required
                  >
                    {RELIEF_GOALS.map((rg) => (
                      <option key={rg} value={rg}>
                        {rg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location with Detect My Location button */}
                <div className="org-form-group full-width">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label className="org-label" style={{ marginBottom: 0 }}>
                      Location / Affected Region <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#059669",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {detectingLocation ? "⏳ Detecting GPS…" : "🎯 Detect My Location"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      name="location"
                      className="org-input"
                      style={{ flex: 1 }}
                      placeholder="Type location manually or click Detect My Location..."
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Urgency */}
                <div className="org-form-group full-width">
                  <label className="org-label">
                    Urgency Priority <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    name="urgency"
                    className="org-input"
                    value={formData.urgency}
                    onChange={handleChange}
                    required
                  >
                    {URGENCIES.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Affected Impact & Target Quantities */}
            <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span>2. Affected Impact & Targets</span>
              </div>

              <div className="org-form-grid">
                {/* Affected People Count */}
                <div className="org-form-group">
                  <label className="org-label">
                    Affected People Count <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="affectedPeopleCount"
                    className="org-input"
                    placeholder="e.g. 2500"
                    value={formData.affectedPeopleCount}
                    onChange={handleChange}
                    min={1}
                    required
                  />
                </div>

                {/* Affected Families Count */}
                <div className="org-form-group">
                  <label className="org-label">
                    Affected Families Count <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="affectedFamiliesCount"
                    className="org-input"
                    placeholder="e.g. 500"
                    value={formData.affectedFamiliesCount}
                    onChange={handleChange}
                    min={1}
                    required
                  />
                </div>

                {/* Target Relief Quantity */}
                <div className="org-form-group">
                  <label className="org-label">Target Relief Quantity (Kits/Items)</label>
                  <input
                    type="number"
                    name="targetQuantity"
                    className="org-input"
                    placeholder="e.g. 1000"
                    value={formData.targetQuantity}
                    onChange={handleChange}
                    min={1}
                  />
                </div>

                {/* Estimated Relief Budget (Optional) */}
                <div className="org-form-group">
                  <label className="org-label">Estimated Relief Budget (₹ Optional)</label>
                  <input
                    type="number"
                    name="estimatedBudget"
                    className="org-input"
                    placeholder="e.g. 500000"
                    value={formData.estimatedBudget}
                    onChange={handleChange}
                    min={0}
                  />
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                    For reporting & logistics planning only (resource donations only).
                  </div>
                </div>

                {/* Start Date */}
                <div className="org-form-group">
                  <label className="org-label">
                    Campaign Start Date <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="org-input"
                    min={todayStr}
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* End Date */}
                <div className="org-form-group">
                  <label className="org-label">
                    Campaign End Date <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    className="org-input"
                    min={formData.startDate || todayStr}
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Campaign Coordinator & Distribution Plan */}
            <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span>3. Coordinator & Execution Plan</span>
              </div>

              <div className="org-form-grid">
                {/* Coordinator Name */}
                <div className="org-form-group">
                  <label className="org-label">
                    Coordinator Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="coordinatorName"
                    className="org-input"
                    placeholder="e.g. Rajesh Kumar (Shelter Lead)"
                    value={formData.coordinatorName}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Coordinator Contact */}
                <div className="org-form-group">
                  <label className="org-label">
                    Coordinator Contact Number <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="coordinatorContact"
                    className="org-input"
                    placeholder="e.g. 9876543210"
                    value={formData.coordinatorContact}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Description */}
                <div className="org-form-group full-width">
                  <label className="org-label">Campaign Background & Need Summary</label>
                  <textarea
                    name="description"
                    className="org-input"
                    rows={3}
                    placeholder="Provide background context on the crisis, community impact, and urgent needs..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                {/* Distribution Plan */}
                <div className="org-form-group full-width">
                  <label className="org-label">Relief Distribution Plan</label>
                  <textarea
                    name="distributionPlan"
                    className="org-input"
                    rows={4}
                    placeholder="Explain how collected resources will be received, verified, packaged, and distributed to affected beneficiaries..."
                    value={formData.distributionPlan}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Document Verification Uploads */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>
                4. Cover Image & Supporting Evidence Documents
              </div>

              {/* Cover Image Upload */}
              <div className="org-form-group full-width" style={{ marginBottom: 16 }}>
                <label className="org-label">Cover Banner Image Upload</label>
                <div
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: 12,
                    padding: 16,
                    textAlign: "center",
                    background: "#f8fafc",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    style={{ display: "none" }}
                    id="cover-upload-humanitarian"
                  />
                  <label htmlFor="cover-upload-humanitarian" style={{ cursor: "pointer" }}>
                    {coverPreview ? (
                      <div>
                        <img
                          src={coverPreview}
                          alt="Cover Preview"
                          style={{ maxHeight: 160, borderRadius: 8, objectFit: "cover", marginBottom: 6 }}
                        />
                        <div style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>Click to change banner</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>🖼️</div>
                        <div style={{ fontWeight: 600, color: "#334155", fontSize: 14 }}>Upload Campaign Banner</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>PNG, JPG or WEBP up to 10MB</div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Evidence Upload */}
              <div className="org-form-group full-width">
                <label className="org-label">
                  Supporting Evidence Upload <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: 12,
                    padding: 16,
                    textAlign: "center",
                    background: "#f8fafc",
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleEvidenceChange}
                    style={{ display: "none" }}
                    id="evidence-upload-humanitarian"
                  />
                  <label htmlFor="evidence-upload-humanitarian" style={{ cursor: "pointer" }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>📎</div>
                    <div style={{ fontWeight: 600, color: "#334155", fontSize: 14 }}>
                      Upload Official Authorization / Disaster Photos / Supporting Proof
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Upload up to 5 images or PDF documents (Required)
                    </div>
                  </label>

                  {evidenceFiles.length > 0 && (
                    <div style={{ marginTop: 12, textAlign: "left", background: "#fff", padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>
                        Selected Files ({evidenceFiles.length}):
                      </div>
                      <ul style={{ fontSize: 12, color: "#475569", paddingLeft: 16, marginTop: 4 }}>
                        {evidenceFiles.map((f, idx) => (
                          <li key={idx}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Campaign Trust Indicators Section */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 12,
                padding: 16,
                marginBottom: 28,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: "#166534", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>🛡️ Campaign Trust & Authenticity Verification</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#15803d", fontWeight: 600 }}>
                <div>✓ Verified Community Shelter Account</div>
                <div>✓ Evidence Documents Uploaded</div>
                <div>✓ Mandatory Admin Review Prior to Live Status</div>
                <div>✓ Full Resource Donation Tracking & Auditing</div>
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <button
                type="submit"
                className="org-btn-primary"
                disabled={submitting || savingDraft}
                style={{
                  background: "linear-gradient(135deg, #059669, #047857)",
                  padding: "12px 28px",
                  fontSize: 15,
                  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                }}
              >
                {submitting ? "Submitting Relief Campaign…" : "Submit Campaign for Admin Verification 🚀"}
              </button>

              <button
                type="button"
                className="org-btn-secondary"
                disabled={submitting || savingDraft}
                onClick={() => submitCampaign(true)}
              >
                {savingDraft ? "Saving Draft…" : "Save as Draft 💾"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Sticky Preview Panel */}
        <div style={{ position: "sticky", top: 24 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a, #1e293b)",
                color: "#fff",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14 }}>
                Live Campaign Preview
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.15)",
                  color: "#e2e8f0",
                }}
              >
                Live Preview
              </span>
            </div>

            {/* Banner Preview */}
            <div style={{ height: 140, background: "#f1f5f9", position: "relative" }}>
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Banner"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>
                  🖼️ Banner Preview
                </div>
              )}

              <span
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 12,
                  background: urgencyBadge.bg,
                  color: urgencyBadge.color,
                }}
              >
                {urgencyBadge.label}
              </span>
            </div>

            {/* Card Content Preview */}
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                {formData.disasterType} • {formData.reliefGoal}
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 6, lineHeight: 1.4 }}>
                {formData.title || "Untitled Emergency Relief Campaign"}
              </h3>

              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span>🏢 {orgInfo.name}</span>
                <span>•</span>
                <span>📍 {formData.location || "Location not set"}</span>
              </div>

              {/* Impact Metrics Badge */}
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10, marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#059669" }}>
                    {formData.affectedFamiliesCount || "0"}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Affected Families</div>
                </div>

                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0284c7" }}>
                    {formData.affectedPeopleCount || "0"}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Affected People</div>
                </div>
              </div>

              {/* Details List */}
              <div style={{ fontSize: 12, color: "#475569", display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Target Quantity:</span>
                  <strong>{formData.targetQuantity ? `${formData.targetQuantity} Kits` : "Not specified"}</strong>
                </div>

                {formData.estimatedBudget && Number(formData.estimatedBudget) > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Estimated Budget:</span>
                    <strong>₹{Number(formData.estimatedBudget).toLocaleString("en-IN")}</strong>
                  </div>
                ) : null}

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Coordinator:</span>
                  <strong>{formData.coordinatorName || "Not assigned"}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Duration:</span>
                  <strong>
                    {new Date(formData.startDate).toLocaleDateString("en-IN")} - {new Date(formData.endDate).toLocaleDateString("en-IN")}
                  </strong>
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  textAlign: "center",
                  padding: "8px",
                  borderRadius: 8,
                  background: "#fef3c7",
                  color: "#d97706",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Status: Pending Admin Approval
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
