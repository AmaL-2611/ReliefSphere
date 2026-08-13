import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./UserMenu.css";

const BACKEND_URL = "http://localhost:5000";

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleLabel(role) {
  switch (role) {
    case "donor": return "Donor";
    case "recipient_org": return "Recipient Organization";
    case "volunteer": return "Volunteer";
    case "admin": return "Administrator";
    default: return role;
  }
}

export default function UserMenu() {
  const navigate = useNavigate();

  // Read from localStorage — re-read each render so it stays fresh
  const getStored = () => JSON.parse(localStorage.getItem("user") || "{}");

  const [displayName, setDisplayName] = useState(() => getStored().fullName || "User");
  // Persist avatar across refreshes by reading it from localStorage
  const [topbarAvatar, setTopbarAvatar] = useState(() => getStored().avatar || "");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ fullName: "" });
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setEditData({ fullName: res.data.user.fullName || "" });
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const openProfile = () => {
    setDropdownOpen(false);
    setModalOpen(true);
    setEditMode(false);
    setSuccessMsg("");
    fetchProfile();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.put("/user/profile", editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Persist updated name to localStorage
      const stored = getStored();
      const updatedUser = { ...stored, fullName: res.data.user.fullName };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      // Update topbar name live
      setDisplayName(res.data.user.fullName);
      setProfile((prev) => ({ ...prev, user: { ...prev.user, ...res.data.user } }));
      setEditMode(false);
      setSuccessMsg("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    setSuccessMsg("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await API.post("/user/profile/avatar", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const newAvatar = res.data.avatar;
      // ── Save avatar path to localStorage so it survives refresh ──
      const stored = getStored();
      localStorage.setItem("user", JSON.stringify({ ...stored, avatar: newAvatar }));
      setTopbarAvatar(newAvatar);
      setProfile((prev) => ({ ...prev, user: { ...prev.user, avatar: newAvatar } }));
      setSuccessMsg("Profile picture updated!");
    } catch (err) {
      console.error("Avatar upload failed", err);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Avatar shown inside the modal (may differ from topbar during upload)
  const modalAvatarUrl = profile?.user?.avatar
    ? `${BACKEND_URL}/${profile.user.avatar}`
    : null;

  // Avatar shown on the topbar button — persists from localStorage
  const topbarAvatarUrl = topbarAvatar ? `${BACKEND_URL}/${topbarAvatar}` : null;

  const displayRole = getRoleLabel(getStored().role);

  return (
    <>
      {/* ── Avatar button ── */}
      <div className="um-wrapper" ref={dropdownRef}>
        <button
          className="um-avatar-btn"
          onClick={() => setDropdownOpen((o) => !o)}
          title="Account"
          id="user-menu-btn"
        >
          {topbarAvatarUrl ? (
            <img src={topbarAvatarUrl} alt="avatar" className="um-avatar-img" />
          ) : (
            <span className="um-avatar-initials">{getInitials(displayName)}</span>
          )}
        </button>

        {dropdownOpen && (
          <div className="um-dropdown" id="user-dropdown">
            <div className="um-dropdown-header">
              <span className="um-dd-name">{displayName}</span>
              <span className="um-dd-role">{displayRole}</span>
            </div>
            <hr className="um-divider" />
            <button className="um-dd-item" onClick={openProfile} id="btn-view-profile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              User Profile
            </button>
            <button className="um-dd-item um-dd-logout" onClick={handleLogout} id="btn-logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* ── Profile Modal ── */}
      {modalOpen && (
        <div className="um-modal-overlay" onClick={() => { setModalOpen(false); setEditMode(false); }}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()} id="profile-modal">

            {/* Header */}
            <div className="um-modal-header">
              <h3>My Profile</h3>
              <button className="um-modal-close" onClick={() => { setModalOpen(false); setEditMode(false); }}>✕</button>
            </div>

            {loading ? (
              <div className="um-loading">Loading profile…</div>
            ) : profile ? (
              <div className="um-modal-body">

                {/* Avatar section */}
                <div className="um-avatar-section">
                  <div className="um-avatar-large" onClick={() => fileInputRef.current.click()} title="Click to change photo">
                    {modalAvatarUrl ? (
                      <img src={modalAvatarUrl} alt="avatar" />
                    ) : (
                      <span>{getInitials(profile.user.fullName)}</span>
                    )}
                    <div className="um-avatar-overlay">
                      {avatarUploading ? "Uploading…" : "📷 Change"}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleAvatarChange}
                    id="avatar-file-input"
                  />
                  <p className="um-avatar-hint">Click the photo to update</p>
                  {successMsg && <p className="um-success">{successMsg}</p>}
                </div>

                {/* Info rows */}
                <div className="um-info-grid">
                  <div className="um-info-row">
                    <label>Full Name</label>
                    {editMode ? (
                      <input
                        className="um-edit-input"
                        value={editData.fullName}
                        onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                        id="edit-fullname"
                      />
                    ) : (
                      <span>{profile.user.fullName}</span>
                    )}
                  </div>

                  <div className="um-info-row">
                    <label>Email</label>
                    <span>{profile.user.email}</span>
                  </div>

                  <div className="um-info-row">
                    <label>Phone</label>
                    <span>{profile.user.phone || <em className="um-empty">Not set</em>}</span>
                  </div>

                  <div className="um-info-row">
                    <label>Role</label>
                    <span className="um-role-badge">{getRoleLabel(profile.user.role)}</span>
                  </div>

                  <div className="um-info-row">
                    <label>Account Status</label>
                    <span className={`um-status-badge ${profile.user.isVerified ? "verified" : "pending"}`}>
                      {profile.user.isVerified ? "✓ Verified" : "⏳ Pending Verification"}
                    </span>
                  </div>

                  <div className="um-info-row">
                    <label>Member Since</label>
                    <span>{new Date(profile.user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                </div>

                {/* Role-specific details */}
                {profile.roleDetails && (
                  <div className="um-role-section">
                    <h4 className="um-role-section-title">
                      {profile.user.role === "donor" && "🎁 Donor Details"}
                      {profile.user.role === "volunteer" && "🙋 Volunteer Details"}
                      {profile.user.role === "recipient_org" && "🏢 Organization Details"}
                    </h4>
                    <div className="um-info-grid">
                      {profile.user.role === "donor" && (
                        <>
                          <div className="um-info-row">
                            <label>Donor Type</label>
                            <span style={{ textTransform: "capitalize" }}>
                              {profile.roleDetails.donorType?.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="um-info-row">
                            <label>Address</label>
                            <span>{profile.roleDetails.address || <em className="um-empty">Not set</em>}</span>
                          </div>
                          <div className="um-info-row">
                            <label>Preferred Categories</label>
                            <span>
                              {profile.roleDetails.preferredCategories?.length > 0
                                ? profile.roleDetails.preferredCategories.join(", ")
                                : <em className="um-empty">None selected</em>}
                            </span>
                          </div>
                        </>
                      )}
                      {profile.user.role === "volunteer" && (
                        <>
                          <div className="um-info-row">
                            <label>Address</label>
                            <span>{profile.roleDetails.address || <em className="um-empty">Not set</em>}</span>
                          </div>
                          <div className="um-info-row">
                            <label>Skills</label>
                            <span>
                              {profile.roleDetails.skills?.length > 0
                                ? profile.roleDetails.skills.join(", ")
                                : <em className="um-empty">None</em>}
                            </span>
                          </div>
                          <div className="um-info-row">
                            <label>Completed Deliveries</label>
                            <span>{profile.roleDetails.completedDeliveries ?? 0}</span>
                          </div>
                          <div className="um-info-row">
                            <label>Verification Status</label>
                            <span className={`um-status-badge ${profile.roleDetails.verificationStatus}`}>
                              {profile.roleDetails.verificationStatus}
                            </span>
                          </div>
                        </>
                      )}
                      {profile.user.role === "recipient_org" && (
                        <>
                          <div className="um-info-row">
                            <label>Organization Name</label>
                            <span>{profile.roleDetails.orgName}</span>
                          </div>
                          <div className="um-info-row">
                            <label>Organization Type</label>
                            <span style={{ textTransform: "capitalize" }}>
                              {profile.roleDetails.orgType?.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="um-info-row">
                            <label>Registration No.</label>
                            <span>{profile.roleDetails.registrationNumber || <em className="um-empty">Not provided</em>}</span>
                          </div>
                          <div className="um-info-row">
                            <label>Address</label>
                            <span>{profile.roleDetails.address || <em className="um-empty">Not set</em>}</span>
                          </div>
                          <div className="um-info-row">
                            <label>Verification Status</label>
                            <span className={`um-status-badge ${profile.roleDetails.verificationStatus}`}>
                              {profile.roleDetails.verificationStatus}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="um-modal-actions">
                  {editMode ? (
                    <>
                      <button className="um-btn-save" onClick={handleSave} disabled={saving} id="btn-save-profile">
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                      <button className="um-btn-cancel" onClick={() => setEditMode(false)} id="btn-cancel-edit">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button className="um-btn-edit" onClick={() => setEditMode(true)} id="btn-edit-profile">
                      ✏️ Edit Profile
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="um-loading">Could not load profile.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
