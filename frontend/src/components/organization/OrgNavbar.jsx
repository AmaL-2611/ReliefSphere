import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../NotificationBell";

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function OrgNavbar({ pageTitle = "Dashboard" }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user.fullName || "Organization";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="org-navbar">
      <div className="on-title-wrap">
        <h1 className="on-page-title">{pageTitle}</h1>
        <span className="on-role-badge">Verified NGO</span>
      </div>

      <div className="on-right" ref={dropdownRef}>
        <NotificationBell />
        <button
          className="on-avatar-btn"
          id="org-profile-dropdown-trigger"
          onClick={() => setDropdownOpen((o) => !o)}
          title="Organization Profile Menu"
        >
          {getInitials(displayName)}
        </button>

        {dropdownOpen && (
          <div className="on-dropdown" id="org-profile-dropdown-menu">
            <div className="on-dd-header">
              <span className="on-dd-name">{displayName}</span>
              <span className="on-dd-role">Organization Account</span>
            </div>
            <hr className="on-dd-divider" />
            <button
              className="on-dd-item"
              id="org-pd-view-profile"
              onClick={() => { setDropdownOpen(false); navigate("/organization/profile"); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              View Profile
            </button>
            <button
              className="on-dd-item"
              id="org-pd-my-reqs"
              onClick={() => { setDropdownOpen(false); navigate("/organization/my-requirements"); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              My Requirements
            </button>
            <hr className="on-dd-divider" />
            <button className="on-dd-item on-dd-logout" id="org-pd-logout" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
