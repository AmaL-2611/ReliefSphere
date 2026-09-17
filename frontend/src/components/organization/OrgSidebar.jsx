import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../api/axios";

export default function OrgSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orgType, setOrgType] = useState(null);

  useEffect(() => {
    const fetchOrgProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await API.get("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const roleDetails = res.data.roleDetails || {};
        if (roleDetails.orgType) {
          setOrgType(roleDetails.orgType);
        } else {
          // Fallback to local storage if present
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          setOrgType(user.orgType || "ngo");
        }
      } catch (err) {
        console.error("Failed to fetch org profile for sidebar:", err);
      }
    };
    fetchOrgProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Check if org can create campaigns (Community Shelter ONLY)
  const canCreateCampaigns = orgType === "community_shelter";

  const BASE_NAV_ITEMS = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/organization-dashboard",
      matchPaths: ["/organization-dashboard", "/organization/dashboard"],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="os-nav-icon">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      id: "create-req",
      label: "Post Requirement",
      path: "/organization/create-requirement",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="os-nav-icon">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      id: "my-reqs",
      label: "My Requirements",
      path: "/organization/my-requirements",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="os-nav-icon">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      id: "incoming-donations",
      label: "Incoming Donations",
      path: "/organization/incoming-donations",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="os-nav-icon">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    },
  ];

  const CAMPAIGN_NAV_ITEMS = [
    {
      id: "create-campaign",
      label: "Create Campaign",
      path: "/organization/create-campaign",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="os-nav-icon">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
    },
    {
      id: "my-campaigns",
      label: "My Campaigns",
      path: "/organization/my-campaigns",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="os-nav-icon">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  ];

  const PROFILE_NAV_ITEM = {
    id: "profile",
    label: "Organization Profile",
    path: "/organization/profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="os-nav-icon">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  return (
    <aside className="org-sidebar">
      {/* Brand */}
      <div className="os-brand">
        <div className="os-brand-icon">🏢</div>
        <div>
          <div className="os-brand-text">ReliefSphere</div>
          <div className="os-brand-sub">
            {orgType === "community_shelter"
              ? "Community Shelter"
              : orgType === "orphanage"
              ? "Orphanage"
              : orgType === "old_age_home"
              ? "Old-Age Home"
              : "NGO Portal"}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="os-nav">
        {BASE_NAV_ITEMS.map((item) => {
          const isActive = item.matchPaths
            ? item.matchPaths.some((p) => location.pathname === p)
            : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.id}
              className={`os-nav-item${isActive ? " active" : ""}`}
              id={`org-sidebar-${item.id}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Campaign Sidebar Menu - Visible ONLY for NGO & Community Shelter */}
        {canCreateCampaigns && (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#94a3b8",
                padding: "16px 12px 6px 12px",
              }}
            >
              Campaigns
            </div>
            {CAMPAIGN_NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.id}
                  className={`os-nav-item${isActive ? " active" : ""}`}
                  id={`org-sidebar-${item.id}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </>
        )}

        {/* Profile Item */}
        <button
          key={PROFILE_NAV_ITEM.id}
          className={`os-nav-item${
            location.pathname.startsWith(PROFILE_NAV_ITEM.path) ? " active" : ""
          }`}
          id={`org-sidebar-${PROFILE_NAV_ITEM.id}`}
          onClick={() => navigate(PROFILE_NAV_ITEM.path)}
          style={{ marginTop: 8 }}
        >
          {PROFILE_NAV_ITEM.icon}
          <span>{PROFILE_NAV_ITEM.label}</span>
        </button>
      </nav>

      {/* Logout */}
      <div>
        <button className="os-logout-btn" id="org-sidebar-logout" onClick={handleLogout}>
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
