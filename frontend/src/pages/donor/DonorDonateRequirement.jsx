import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";

const UNITS = ["Packets", "Kg", "Pieces", "Boxes", "Sets", "Liters"];

const URGENCIES = {
  low: { label: "Low", color: "#16a34a", bg: "#dcfce7" },
  medium: { label: "Medium", color: "#d97706", bg: "#fef3c7" },
  high: { label: "High", color: "#dc2626", bg: "#fee2e2" },
  critical: { label: "Critical", color: "#991b1b", bg: "#ffe4e6" },
};

export default function DonorDonateRequirement() {
  const { requirementId } = useParams();
  const navigate = useNavigate();

  const [requirement, setRequirement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [userPhone, setUserPhone] = useState("");

  const [form, setForm] = useState({
    quantity: "",
    unit: "Packets",
    pickupAddress: "",
    contactNumber: "",
    notes: "",
    imagePreview: null,
  });

  // Fetch Requirement & Donor Profile Address
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        // Fetch Requirement
        const reqRes = await API.get(`/requirements/${requirementId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const reqData = reqRes.data.requirement;
        setRequirement(reqData);
        if (reqData?.unit) {
          setForm((f) => ({ ...f, unit: reqData.unit }));
        }

        // Fetch Donor Profile Address & Phone
        const profRes = await API.get("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = profRes.data.user || {};
        const roleDetails = profRes.data.roleDetails || {};
        const addr = roleDetails.address || user.address || "";
        const phone = user.phone || roleDetails.phone || "";

        if (addr) {
          setRegisteredAddress(addr);
          setForm((f) => ({ ...f, pickupAddress: addr }));
        }
        if (phone) {
          setUserPhone(phone);
          setForm((f) => ({ ...f, contactNumber: phone }));
        }
      } catch (err) {
        toast.error("Failed to load requirement details.");
      } finally {
        setLoading(false);
      }
    };

    if (requirementId) fetchData();
  }, [requirementId]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
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
    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.error("Please enter a valid donation quantity.");
      return;
    }
    if (!form.pickupAddress.trim()) {
      toast.error("Please enter your pickup address.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        requirementId,
        quantity: Number(form.quantity),
        unit: form.unit,
        pickupAddress: form.pickupAddress,
        contactNumber: form.contactNumber,
        notes: form.notes,
        imageUrl: form.imagePreview || "",
      };

      await API.post("/donations/direct", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("🎁 Pledge submitted! Pending NGO approval.");
      setTimeout(() => navigate("/donor/my-donations"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to submit pledge.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b", fontWeight: 600 }}>
        Loading requirement details…
      </div>
    );
  }

  if (!requirement) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b" }}>
        <h3>Requirement not found</h3>
        <button className="btn-submit" onClick={() => navigate("/donor/browse-requirements")} style={{ marginTop: 16 }}>
          Back to Browse Requirements
        </button>
      </div>
    );
  }

  const orgName = requirement.organizationId?.orgName || "Hope Foundation";
  const urgencyObj = URGENCIES[requirement.urgency] || URGENCIES.medium;
  const neededQty = requirement.quantity || 1;
  const donorQty = Number(form.quantity || 0);
  const remainingNeed = Math.max(0, neededQty - donorQty);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 50 }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
          Donate To Requirement
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>
          Support a verified NGO by fulfilling this requirement directly.
        </p>
      </div>

      {/* Main Layout: Info & Form (Left) vs Summary Panel (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, alignItems: "start" }}>
        <div>
          {/* SECTION 1: Requirement Information Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 28,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 20px rgba(15,23,42,0.05)",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>{orgName}</span>
                  <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999 }}>
                    ✓ Verified NGO
                  </span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {requirement.title}
                </h2>
              </div>

              <span
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  background: urgencyObj.bg,
                  color: urgencyObj.color,
                }}
              >
                {requirement.urgency} Urgency
              </span>
            </div>

            {/* Specs Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
                background: "#f8fafc",
                padding: 16,
                borderRadius: 14,
                marginBottom: 16,
                border: "1px solid #f1f5f9",
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Category</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2, textTransform: "capitalize" }}>
                  📦 {requirement.category}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Needed</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#059669", marginTop: 2 }}>
                  {requirement.quantity} {requirement.unit || "Packets"}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Beneficiaries</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  👥 {requirement.beneficiaryCount || requirement.quantity} People
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Required Before</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginTop: 2 }}>
                  📅 {requirement.requiredBefore ? new Date(requirement.requiredBefore).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Aug 25 2026"}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Location</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginTop: 2 }}>
                  📍 {requirement.location || "Verified Location"}
                </div>
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.5, margin: 0 }}>
              {requirement.description || "Food support required for flood affected families currently residing in relief camps."}
            </p>
          </div>

          {/* SECTION 2: Donation Form */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 28,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 20px rgba(15,23,42,0.05)",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }}></span>
              Enter Your Donation Details
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Quantity */}
                <div>
                  <label className="form-label" htmlFor="quantity">
                    Donation Quantity <span style={{ color: "#ef4444" }}>*</span>
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
                    Unit <span style={{ color: "#ef4444" }}>*</span>
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
                        🏠 Use Profile Address
                      </button>
                    )}
                  </div>
                  <input
                    className="form-control"
                    id="pickupAddress"
                    name="pickupAddress"
                    type="text"
                    placeholder="e.g. MG Road, Trivandrum"
                    value={form.pickupAddress}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Contact Number */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label" htmlFor="contactNumber">
                    Contact Number <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className="form-control"
                    id="contactNumber"
                    name="contactNumber"
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={form.contactNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Additional Notes */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label" htmlFor="notes">
                    Additional Notes
                  </label>
                  <textarea
                    className="form-control"
                    id="notes"
                    name="notes"
                    placeholder="Special instructions for pickup, packaging details…"
                    value={form.notes}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                {/* Upload Image */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Upload Donation Image (Optional)</label>
                  <div
                    style={{
                      border: "2px dashed #cbd5e1",
                      borderRadius: 16,
                      padding: 20,
                      textAlign: "center",
                      background: "#f8fafc",
                      cursor: "pointer",
                      position: "relative",
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
                          alt="Preview"
                          style={{ maxHeight: 160, borderRadius: 12, objectFit: "cover" }}
                        />
                        <div style={{ fontSize: 12, color: "#059669", fontWeight: 700, marginTop: 8 }}>
                          ✓ Image Uploaded (Click to change)
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#334155" }}>
                          Click or Drag to Upload Donation Photo
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: 24, display: "flex", gap: 14 }}>
                <button
                  type="submit"
                  disabled={submitting}
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
                    boxShadow: "0 4px 16px rgba(5,150,105,0.3)",
                  }}
                >
                  {submitting ? "Submitting Pledge…" : "🎁 Pledge Donation"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/donor/browse-requirements")}
                  style={{
                    padding: "14px 24px",
                    borderRadius: 14,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#334155",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SECTION 3: Donation Summary Card (Sticky Right Side) */}
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
              <span style={{ fontSize: 22 }}>📋</span>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                  Donation Summary
                </h4>
                <span style={{ fontSize: 11, color: "#64748b" }}>Fulfillment preview</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Recipient NGO</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  🏢 {orgName}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Requirement Quantity Needed</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginTop: 2 }}>
                  📦 {neededQty} {form.unit}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Your Donation Quantity</span>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#059669", marginTop: 2 }}>
                  🎁 {donorQty || 0} {form.unit}
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Remaining Need After Donation</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: remainingNeed === 0 ? "#059669" : "#d97706", marginTop: 2 }}>
                  {remainingNeed === 0 ? "🎉 Fully Fulfilled!" : `${remainingNeed} ${form.unit} remaining`}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Urgency Level</span>
                <div style={{ marginTop: 4 }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      background: urgencyObj.bg,
                      color: urgencyObj.color,
                      textTransform: "uppercase",
                    }}
                  >
                    {requirement.urgency} Urgency
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #e2e8f0", textAlign: "center" }}>
              <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>
                🔒 Direct NGO Contribution Guarantee
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
