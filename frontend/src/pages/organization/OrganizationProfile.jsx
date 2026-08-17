import { useState, useEffect } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";

export default function OrganizationProfile() {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    orgType: "",
    registrationNumber: "",
    verificationStatus: "verified",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = res.data.user || res.data;
        setProfile({
          fullName: user.fullName || user.orgName || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          orgType: user.orgType || "ngo",
          registrationNumber: user.registrationNumber || "",
          verificationStatus: user.isVerified ? "verified" : "pending",
        });
      } catch (err) {
        toast.error("Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await API.put(
        "/user/profile",
        {
          fullName: profile.fullName,
          phone: profile.phone,
          address: profile.address,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Profile updated successfully!");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...user, fullName: profile.fullName }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New passwords do not match.");
    }
    setChangingPw(true);
    try {
      const token = localStorage.getItem("token");
      await API.put(
        "/user/profile",
        { password: passwordForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Password updated successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password.");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>Organization Profile</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Manage your organization details, contact information, and security settings.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Left Card: Summary */}
        <div className="org-card" style={{ height: "fit-content" }}>
          <div style={{ textAlign: "center", padding: "10px 0 20px 0" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0891b2, #06b6d4)",
                color: "white",
                fontSize: 28,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px auto",
                boxShadow: "0 6px 20px rgba(8, 145, 178, 0.3)",
              }}
            >
              🏢
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{profile.fullName || "Organization"}</h3>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{profile.email}</p>
            <div style={{ marginTop: 12 }}>
              <span className="org-badge org-badge-fulfilled">
                ✓ {profile.verificationStatus === "verified" ? "Verified NGO" : "Pending Verification"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Forms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Profile Edit Form */}
          <div className="org-card">
            <div className="org-card-header">
              <div className="org-card-title">
                <span className="org-card-title-dot" />
                Organization Details
              </div>
            </div>

            {loading ? (
              <div>Loading profile details…</div>
            ) : (
              <form onSubmit={handleProfileSubmit}>
                <div className="org-form-grid">
                  <div className="org-form-group">
                    <label className="org-label">Organization Name</label>
                    <input
                      className="org-input"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="org-form-group">
                    <label className="org-label">Email Address (Read-Only)</label>
                    <input className="org-input" value={profile.email} disabled style={{ background: "#f8fafc" }} />
                  </div>
                  <div className="org-form-group">
                    <label className="org-label">Contact Phone</label>
                    <input
                      className="org-input"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div className="org-form-group">
                    <label className="org-label">Registration Number</label>
                    <input className="org-input" value={profile.registrationNumber || "REG-NGO-2026-X"} disabled style={{ background: "#f8fafc" }} />
                  </div>
                  <div className="org-form-group full-width">
                    <label className="org-label">Address</label>
                    <input
                      className="org-input"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <button type="submit" className="org-btn-primary" disabled={saving}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Password Change Form */}
          <div className="org-card">
            <div className="org-card-header">
              <div className="org-card-title">
                <span className="org-card-title-dot" style={{ background: "#f59e0b" }} />
                Security & Password
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="org-form-grid">
                <div className="org-form-group">
                  <label className="org-label">New Password</label>
                  <input
                    type="password"
                    className="org-input"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="org-form-group">
                  <label className="org-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="org-input"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <button type="submit" className="org-btn-primary" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }} disabled={changingPw}>
                  {changingPw ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
