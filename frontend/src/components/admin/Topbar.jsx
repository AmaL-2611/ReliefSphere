import { FaBell, FaSearch, FaUserCircle } from "react-icons/fa";
import "../../styles/admin/topbar.css";

function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2>Dashboard</h2>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <FaSearch />
          <input type="text" placeholder="Search..." />
        </div>

        <button className="notification-btn">
          <FaBell />
          <span className="notification-dot"></span>
        </button>

        <div className="profile">
          <FaUserCircle className="profile-icon" />

          <div>
            <h6>Administrator</h6>
            <small>Admin</small>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
