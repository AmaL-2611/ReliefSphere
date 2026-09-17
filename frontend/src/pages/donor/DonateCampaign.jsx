import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";

const UNITS = ["Packets", "Kg", "Pieces", "Boxes", "Sets", "Liters"];
const CATEGORIES = ["food", "clothes", "books", "medicine", "essentials"];

export default function DonateCampaign() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    donationName: "",
    category: "essentials",
    quantity: "10",
    unit: "Packets",
    pickupAddress: "",
    contactNumber: "",
    notes: "",
    imagePreview: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Fetch Campaign Details
        const campRes = await API.get(`/campaigns/${campaignId}`);
        if (campRes.data.success) {
          const camp = campRes.data.campaign;
          setCampaign(camp);

          let matchedCategory = "essentials";
          const goalLower = (camp.reliefGoal || camp.category || "").toLowerCase();
          if (goalLower.includes("food")) matchedCategory = "food";
          else if (goalLower.includes("cloth") || goalLower.includes("blanket")) matchedCategory = "clothes";
          else if (goalLower.includes("book") || goalLower.includes("school")) matchedCategory = "books";
          else if (goalLower.includes("med")) matchedCategory = "medicine";

          setForm((f) => ({
            ...f,
            category: matchedCategory,
            donationName: `Relief Supplies for ${camp.title}`,
          }));
        }

        // Fetch Donor Profile
        if (token) {
          const profRes = await API.get("/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const user = profRes.data.user || {};
          const roleDetails = profRes.data.roleDetails || {};
          const addr = roleDetails.address || user.address || "";
          const phone = user.phone || roleDetails.phone || "";

          setForm((f) => ({
            ...f,
            pickupAddress: f.pickupAddress || addr,
            contactNumber: f.contactNumber || phone,
          }));
        }
      } catch (err) {
        toast.error("Failed to load disaster campaign details.");
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) fetchData();
  }, [campaignId]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image file size must be under 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm((f) => ({ ...f, imagePreview: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.quantity || Number(form.quantity) <= 0) {
      return toast.error("Please enter a valid donation quantity.");
    }
    if (!form.pickupAddress.trim()) {
      return toast.error("Please enter your pickup address.");
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const payload = {
        donationName: form.donationName,
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit,
        pickupAddress: form.pickupAddress,
        contactNumber: form.contactNumber,
        notes: form.notes,
        image: form.imagePreview || "",
      };

      const res = await API.post(`/campaigns/${campaignId}/donate`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(
        res.data.message || "🎁 Relief supplies pledged successfully for this campaign!"
      );

      setTimeout(() => navigate("/donor/my-donations"), 1500);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to pledge donation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b", fontWeight: 600 }}>
        Loading campaign details…
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b" }}>
        <h3>Campaign Not Found</h3>
        <button
          className="org-btn-primary"
          onClick={() => navigate("/donor/browse-campaigns")}
          style={{ marginTop: 16 }}
        >
          Back to Browse Campaigns
        </button>
      </div>
    );
  }

  const orgName = campaign.organizationId?.orgName || "Community Shelter";

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", paddingBottom: 40 }}>
      {/* Back Button */}
      <button
        onClick={() => navigate("/donor/browse-campaigns")}
        style={{
          background: "none",
          border: "none",
          color: "#059669",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 14,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← Back to Browse Campaigns
      </button>

      {/* Header Summary Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #059669, #047857)",
          borderRadius: 16,
          padding: 24,
          color: "#fff",
          marginBottom: 24,
          boxShadow: "0 10px 25px rgba(5, 150, 105, 0.25)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.9 }}>
          Pledge Relief Supplies • {campaign.disasterType || "Emergency"} Response
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
          {campaign.title}
        </h1>
        <div style={{ fontSize: 13, marginTop: 8, opacity: 0.95, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span>🏢 {orgName}</span>
          <span>📍 {campaign.location}</span>
          <span>👥 {campaign.affectedFamiliesCount || 0} Affected Families</span>
          <span>🎯 Goal: {campaign.reliefGoal}</span>
        </div>
      </div>

      {/* Form Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          border: "1px solid #e2e8f0",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Item Title */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                Donation / Relief Kit Title <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                name="donationName"
                value={form.donationName}
                onChange={handleChange}
                placeholder="e.g. 25 Family Food Packets & Hygiene Kits"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                Category <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  textTransform: "capitalize",
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity & Unit */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                  Quantity <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  min={1}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ width: 120 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                  Unit
                </label>
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pickup Address */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                Pickup Location Address <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                name="pickupAddress"
                rows={2}
                value={form.pickupAddress}
                onChange={handleChange}
                placeholder="Enter complete address for volunteer pickup & collection..."
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              />
            </div>

            {/* Contact Number */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                Contact Number
              </label>
              <input
                type="text"
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                Item Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{
                  width: "100%",
                  padding: "8px",
                  fontSize: 13,
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                }}
              />
            </div>

            {/* Notes */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                Logistics & Special Instructions
              </label>
              <textarea
                name="notes"
                rows={2}
                value={form.notes}
                onChange={handleChange}
                placeholder="Specify packaging details, expiry dates, or volunteer collection instructions..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Submit Action */}
          <div style={{ marginTop: 28, display: "flex", gap: 14 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #059669, #047857)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
              }}
            >
              {submitting ? "Pledging Supplies…" : "Pledge Relief Supplies 🎁"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/donor/browse-campaigns")}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#475569",
                fontWeight: 600,
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
  );
}
