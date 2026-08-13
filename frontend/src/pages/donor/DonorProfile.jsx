import { useState } from "react";

const DUMMY_PROFILE = {
  name: "Amal Babu",
  email: "amal@gmail.com",
  phone: "9876543210",
  address: "Kottayam, Kerala",
  avatar: null,
  totalDonations: 12,
  delivered: 7,
  orgsHelped: 4,
};

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function DonorProfile() {
  const [profile, setProfile] = useState(DUMMY_PROFILE);
  const [editData, setEditData] = useState({
    name: profile.name,
    phone: profile.phone,
    address: profile.address,
  });
  const [pwData, setPwData] = useState({ current: "", newPw: "", confirm: "" });
  const [showPwSection, setShowPwSection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setEditData((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handlePwChange = (e) => {
    setPwData((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((res) => setTimeout(res, 1000));
    setProfile((p) => ({ ...p, ...editData }));
    setSaving(false);
    setSuccess("Profile updated successfully! ✅");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleChangePw = async () => {
    if (pwData.newPw !== pwData.confirm) {
      setSuccess("❌ Passwords do not match.");
      return;
    }
    setSaving(true);
    await new Promise((res) => setTimeout(res, 1000));
    setSaving(false);
    setPwData({ current: "", newPw: "", confirm: "" });
    setShowPwSection(false);
    setSuccess("Password changed successfully! ✅");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account information and security settings.</p>
      </div>

      {success && (
        <div className="alert-success">{success}</div>
      )}

      <div className="profile-grid">
        {/* Left — Profile Card */}
        <div className="profile-card">
          <div className="profile-card-banner" />
          <div className="profile-card-avatar-wrap">
            <div className="profile-avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt="avatar" />
              ) : (
                getInitials(profile.name)
              )}
            </div>
            <div className="profile-name">{profile.name}</div>
            <div className="profile-role-badge">🎁 Donor</div>

            {/* Quick stats */}
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-val">{profile.totalDonations}</div>
                <div className="profile-stat-label">Donations</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-val">{profile.delivered}</div>
                <div className="profile-stat-label">Delivered</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-val">{profile.orgsHelped}</div>
                <div className="profile-stat-label">NGOs</div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div style={{ padding: "16px 20px 20px", borderTop: "1px solid #e2e8f0" }}>
            {[
              { icon: "✉️", label: "Email", value: profile.email },
              { icon: "📞", label: "Phone", value: profile.phone },
              { icon: "📍", label: "Address", value: profile.address },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 13.5, color: "#1e293b", fontWeight: 500, marginTop: 2 }}>
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Edit Panel */}
        <div>
          {/* Update Profile */}
          <div className="profile-edit-card" style={{ marginBottom: 20 }}>
            <div className="profile-edit-header">
              <h3>✏️ Update Profile</h3>
            </div>
            <div className="profile-edit-body">
              <div className="profile-edit-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-name">Full Name</label>
                  <input
                    className="form-control"
                    id="edit-name"
                    name="name"
                    value={editData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    value={profile.email}
                    disabled
                    style={{ opacity: 0.6, cursor: "not-allowed" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-phone">Phone</label>
                  <input
                    className="form-control"
                    id="edit-phone"
                    name="phone"
                    value={editData.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-address">Address</label>
                  <input
                    className="form-control"
                    id="edit-address"
                    name="address"
                    value={editData.address}
                    onChange={handleChange}
                    placeholder="Address"
                  />
                </div>
              </div>

              <div className="profile-actions">
                <button
                  className="btn-update"
                  id="save-profile-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "💾 Save Changes"}
                </button>
                <button
                  className="btn-change-pw"
                  id="toggle-pw-btn"
                  onClick={() => setShowPwSection((v) => !v)}
                >
                  🔑 Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Change Password */}
          {showPwSection && (
            <div className="profile-edit-card">
              <div className="profile-edit-header">
                <h3>🔐 Change Password</h3>
              </div>
              <div className="profile-edit-body">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="current-pw">Current Password</label>
                    <input
                      className="form-control"
                      id="current-pw"
                      name="current"
                      type="password"
                      value={pwData.current}
                      onChange={handlePwChange}
                      placeholder="Current password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="new-pw">New Password</label>
                    <input
                      className="form-control"
                      id="new-pw"
                      name="newPw"
                      type="password"
                      value={pwData.newPw}
                      onChange={handlePwChange}
                      placeholder="New password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm-pw">Confirm New Password</label>
                    <input
                      className="form-control"
                      id="confirm-pw"
                      name="confirm"
                      type="password"
                      value={pwData.confirm}
                      onChange={handlePwChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <div className="profile-actions" style={{ marginTop: 20 }}>
                  <button
                    className="btn-update"
                    id="change-pw-btn"
                    onClick={handleChangePw}
                    disabled={saving}
                  >
                    {saving ? "Updating…" : "🔒 Update Password"}
                  </button>
                  <button
                    className="btn-change-pw"
                    onClick={() => setShowPwSection(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
