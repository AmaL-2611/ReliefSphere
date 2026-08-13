import { useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/donor-dashboard",
    matchPaths: ["/donor-dashboard"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ds-nav-icon">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "create",
    label: "Create Donation",
    path: "/donor/create-donation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ds-nav-icon">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    id: "my-donations",
    label: "My Donations",
    path: "/donor/my-donations",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ds-nav-icon">
        <path d="M20 12V22H4V12" />
        <path d="M22 7H2v5h20V7z" />
        <path d="M12 22V7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    id: "track",
    label: "Track Donation",
    path: "/donor/track-donation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ds-nav-icon">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    path: "/donor/profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ds-nav-icon">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function DonorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="donor-sidebar">
      {/* Brand */}
      <div className="ds-brand">
        <div className="ds-brand-icon">🌍</div>
        <div>
          <div className="ds-brand-text">ReliefSphere</div>
          <div className="ds-brand-sub">AI Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="ds-nav">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === "/donor-dashboard"
              ? location.pathname === "/donor-dashboard" || location.pathname.startsWith("/donor-dashboard/")
              : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.id}
              className={`ds-nav-item${isActive ? " active" : ""}`}
              id={`sidebar-${item.id}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span className="ds-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="ds-nav-logout">
        <button className="ds-logout-btn" id="sidebar-logout" onClick={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
