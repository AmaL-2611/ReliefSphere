import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBuilding,
  FaHandsHelping,
  FaUsers,
  FaGift,
  FaTruck,
  FaBullhorn,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

import "../../styles/admin/sidebar.css";

const menuItems = [
  { name: "Dashboard", icon: <FaTachometerAlt />, path: "/admin" },
  { name: "Organizations", icon: <FaBuilding />, path: "/admin/organizations" },
  { name: "Volunteers", icon: <FaHandsHelping />, path: "/admin/volunteers" },
  { name: "Donors", icon: <FaUsers />, path: "/admin/donors" },
  { name: "Donations", icon: <FaGift />, path: "/admin/donations" },
  { name: "Deliveries", icon: <FaTruck />, path: "/admin/deliveries" },
  { name: "Campaigns", icon: <FaBullhorn />, path: "/admin/campaigns" },
  { name: "Analytics", icon: <FaChartBar />, path: "/admin/analytics" },
  { name: "Settings", icon: <FaCog />, path: "/admin/settings" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h3>ReliefSphere AI</h3>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
            end={item.path === "/admin"}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/login" className="menu-item">
          <FaSignOutAlt />
          <span>Logout</span>
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
