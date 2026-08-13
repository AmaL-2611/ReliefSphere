import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const DONATION_TYPES = ["Food", "Clothes", "Books", "Medicine", "Electronics", "Other"];

export default function CreateDonation() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    donationType: "",
    donationName: "",
    quantity: "",
    description: "",
    pickupAddress: "",
    image: null,
  });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((f) => ({ ...f, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API call
    await new Promise((res) => setTimeout(res, 1400));

    setSubmitting(false);
    setSuccess(true);

    setTimeout(() => {
      navigate("/donor/my-donations");
    }, 2000);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Create Donation</h1>
        <p className="page-subtitle">Fill in the details to submit a new donation for redistribution.</p>
      </div>

      {success && (
        <div className="alert-success">
          ✅ Donation submitted successfully! Redirecting to My Donations…
        </div>
      )}

      <div className="form-card">
        {/* Card header with gradient */}
        <div className="form-card-header">
          <h2>🎁 New Donation Details</h2>
          <p>Help communities in need by sharing your resources through ReliefSphere AI.</p>
        </div>

        <div className="form-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Donation Type */}
              <div className="form-group">
                <label className="form-label" htmlFor="donationType">
                  Donation Type <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  id="donationType"
                  name="donationType"
                  value={form.donationType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select type…</option>
                  {DONATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Donation Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="donationName">
                  Donation Name <span className="required">*</span>
                </label>
                <input
                  className="form-control"
                  id="donationName"
                  name="donationName"
                  type="text"
                  placeholder="e.g. Rice & Lentils Package"
                  value={form.donationName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label className="form-label" htmlFor="quantity">
                  Quantity <span className="required">*</span>
                </label>
                <input
                  className="form-control"
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  placeholder="e.g. 25"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Pickup Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="pickupAddress">
                  Pickup Address <span className="required">*</span>
                </label>
                <input
                  className="form-control"
                  id="pickupAddress"
                  name="pickupAddress"
                  type="text"
                  placeholder="e.g. MG Road, Kottayam, Kerala"
                  value={form.pickupAddress}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group full-width">
                <label className="form-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  placeholder="Describe the donation — condition, contents, any special notes…"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              {/* Image Upload */}
              <div className="form-group full-width">
                <label className="form-label">Donation Image</label>
                <div
                  className={`image-upload-area${imagePreview ? " has-file" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  id="image-upload-area"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="upload-preview" />
                  ) : (
                    <>
                      <div className="upload-icon">📸</div>
                      <div className="upload-text">Click to upload an image</div>
                      <div className="upload-hint">PNG, JPG, WEBP up to 5MB</div>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                  id="image-file-input"
                />
              </div>
            </div>

            {/* Submit */}
            <div style={{ marginTop: 28, display: "flex", gap: 14, alignItems: "center" }}>
              <button
                type="submit"
                className="btn-submit"
                id="create-donation-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>⏳ Submitting…</>
                ) : (
                  <>🚀 Submit Donation</>
                )}
              </button>
              <button
                type="button"
                className="btn-change-pw"
                onClick={() => navigate("/donor/my-donations")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
