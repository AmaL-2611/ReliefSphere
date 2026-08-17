import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../NotificationBell";

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function VolNavbar({ pageTitle = "Dashboard" }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user.fullName || "Volunteer";

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
    <header className="vol-navbar">
      <div className="vn-title-wrap">
        <h1 className="vn-page-title">{pageTitle}</h1>
        <span className="vn-role-badge">Verified Volunteer</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }} ref={dropdownRef}>
        <NotificationBell />
        <button
          className="vn-avatar-btn"
          id="vol-profile-dropdown-trigger"
          onClick={() => setDropdownOpen((o) => !o)}
          title="Volunteer Profile Menu"
        >
          {getInitials(displayName)}
        </button>

        {dropdownOpen && (
          <div className="vn-dropdown" id="vol-profile-dropdown-menu">
            <div style={{ padding: "10px 12px" }}>
              <span style={{ fontSize: 14, fontWeight: 700, display: "block", color: "#1e293b" }}>{displayName}</span>
              <span style={{ fontSize: 12, color: "#64748b" }}>Volunteer Partner</span>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "6px 0" }} />
            <button
              style={{
                width: "100%", padding: "9px 12px", border: "none", background: "transparent",
                textAlign: "left", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#1e293b",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10
              }}
              id="vol-pd-view-profile"
              onClick={() => { setDropdownOpen(false); navigate("/volunteer/profile"); }}
            >
              👤 View Profile
            </button>
            <button
              style={{
                width: "100%", padding: "9px 12px", border: "none", background: "transparent",
                textAlign: "left", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#1e293b",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10
              }}
              id="vol-pd-deliveries"
              onClick={() => { setDropdownOpen(false); navigate("/volunteer/assigned-deliveries"); }}
            >
              📦 My Deliveries
            </button>
            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "6px 0" }} />
            <button
              style={{
                width: "100%", padding: "9px 12px", border: "none", background: "transparent",
                textAlign: "left", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#ef4444",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10
              }}
              id="vol-pd-logout"
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
