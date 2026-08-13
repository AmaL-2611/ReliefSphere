/**
 * ProfileDropdown — standalone re-export for use anywhere outside the Navbar.
 * The primary dropdown is embedded in DonorNavbar.jsx.
 * This component wraps the same UI for standalone use cases.
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "http://localhost:5000";

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function ProfileDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user.fullName || "Amal Babu";
  const avatarUrl = user.avatar ? `${BACKEND_URL}/${user.avatar}` : null;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="dn-profile-wrapper" ref={ref}>
      <button
        className="dn-avatar-btn"
        id="profile-dropdown-trigger"
        onClick={() => setOpen((o) => !o)}
        title="Profile menu"
      >
        {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : getInitials(displayName)}
      </button>

      {open && (
        <div className="dn-dropdown" id="profile-dropdown-menu">
          <div className="dn-dropdown-header">
            <span className="dn-dd-name">{displayName}</span>
            <span className="dn-dd-role">Donor</span>
          </div>
          <hr className="dn-dd-divider" />
          <button
            className="dn-dd-item"
            id="pd-view-profile"
            onClick={() => { setOpen(false); navigate("/donor/profile"); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            View Profile
          </button>
          <button
            className="dn-dd-item"
            id="pd-edit-profile"
            onClick={() => { setOpen(false); navigate("/donor/profile"); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Profile
          </button>
          <hr className="dn-dd-divider" />
          <button className="dn-dd-item dn-dd-logout" id="pd-logout" onClick={handleLogout}>
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
  );
}
