import UserMenu from "../../components/UserMenu";
import "../../pages/donor/DonorDashboard.css";

function OrganizationDashboard() {
  return (
    <div className="dash-root">
      {/* Top Bar */}
      <header className="dash-topbar">
        <div className="dash-topbar-left">
          <div className="dash-logo">
            <span className="dash-logo-icon"></span>
            <span className="dash-logo-text">ReliefSphere </span>
          </div>
        </div>
        <div className="dash-topbar-right">
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="dash-main">
        <h2 className="dash-welcome">Welcome, Organization 🏢</h2>
      </main>
    </div>
  );
}

export default OrganizationDashboard;
