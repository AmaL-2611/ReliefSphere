import { useState, useEffect } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";

export default function VolunteerProfile() {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    skills: [],
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
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          skills: user.skills || ["Driving", "Logistics & Delivery", "First Aid"],
          verificationStatus: user.isVerified ? "verified" : "pending",
        });
      } catch (err) {
        toast.error("Failed to load profile.");
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
      return toast.error("Passwords do not match.");
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>Volunteer Profile</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Manage your personal details, registered skills, and security settings.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Summary Card */}
        <div className="vol-card" style={{ height: "fit-content" }}>
          <div style={{ textAlign: "center", padding: "10px 0 20px 0" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                color: "white",
                fontSize: 28,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px auto",
                boxShadow: "0 6px 20px rgba(79, 70, 229, 0.3)",
              }}
            >
              🚗
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{profile.fullName || "Volunteer Partner"}</h3>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{profile.email}</p>

            <div style={{ marginTop: 12 }}>
              <span
                style={{
                  background: "#d1fae5",
                  color: "#047857",
                  padding: "4px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                ✓ Verified Volunteer
              </span>
            </div>

            {/* Skills */}
            <div style={{ marginTop: 20, textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>
                Verified Skills
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {profile.skills.map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#e0e7ff",
                      color: "#4338ca",
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Forms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Profile Form */}
          <div className="vol-card">
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", marginBottom: 16 }}>
              Personal Details
            </div>

            {loading ? (
              <div>Loading profile…</div>
            ) : (
              <form onSubmit={handleProfileSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 6 }}>Full Name</label>
                    <input
                      className="org-input"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 6 }}>Email (Read-Only)</label>
                    <input className="org-input" value={profile.email} disabled style={{ background: "#f8fafc" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 6 }}>Phone Number</label>
                    <input
                      className="org-input"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 6 }}>Address</label>
                    <input
                      className="org-input"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <button type="submit" className="vol-btn-primary" disabled={saving}>
                    {saving ? "Saving…" : "Save Profile"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Password Form */}
          <div className="vol-card">
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", marginBottom: 16 }}>
              Security & Password
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 6 }}>New Password</label>
                  <input
                    type="password"
                    className="org-input"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 6 }}>Confirm New Password</label>
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
                <button type="submit" className="vol-btn-primary" disabled={changingPw}>
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
