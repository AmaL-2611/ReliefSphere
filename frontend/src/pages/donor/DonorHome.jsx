import StatsCard from "../../components/donor/StatsCard";
import RecentDonationTable from "../../components/donor/RecentDonationTable";

const user = JSON.parse(localStorage.getItem("user") || "{}");
const donorName = user.fullName || "Amal Babu";

export default function DonorHome() {
  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Welcome back, {donorName.split(" ")[0]} 👋</h1>
        <p className="page-subtitle">
          Here's an overview of your donation activity on ReliefSphere AI.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          icon="🎁"
          value="12"
          label="Total Donations"
          gradientStart="#10b981"
          gradientEnd="#34d399"
          iconBg="#d1fae5"
          trend="All time"
        />
        <StatsCard
          icon="⚡"
          value="5"
          label="Active Donations"
          gradientStart="#f59e0b"
          gradientEnd="#fbbf24"
          iconBg="#fef3c7"
          trend="In progress"
        />
        <StatsCard
          icon="✅"
          value="7"
          label="Delivered Donations"
          gradientStart="#3b82f6"
          gradientEnd="#60a5fa"
          iconBg="#dbeafe"
          trend="Completed"
        />
        <StatsCard
          icon="🏢"
          value="4"
          label="Organizations Helped"
          gradientStart="#8b5cf6"
          gradientEnd="#a78bfa"
          iconBg="#ede9fe"
          trend="Impacted"
        />
      </div>

      {/* Quick Actions */}
      <div className="section-card" style={{ marginBottom: 28 }}>
        <div className="section-card-header">
          <div className="section-card-title">
            <span className="section-card-title-dot" />
            Quick Actions
          </div>
        </div>
        <div className="section-card-body" style={{ padding: "20px 24px", display: "flex", gap: 14, flexWrap: "wrap" }}>
          <a
            href="/donor/create-donation"
            className="action-btn action-btn-view"
            id="quick-create-btn"
            style={{ padding: "10px 20px", fontSize: 14 }}
          >
            ➕ New Donation
          </a>
          <a
            href="/donor/my-donations"
            className="action-btn"
            id="quick-my-donations-btn"
            style={{ padding: "10px 20px", fontSize: 14, background: "#eff6ff", color: "#2563eb" }}
          >
            📋 View All Donations
          </a>
          <a
            href="/donor/track-donation"
            className="action-btn"
            id="quick-track-btn"
            style={{ padding: "10px 20px", fontSize: 14, background: "#fef3c7", color: "#d97706" }}
          >
            🔍 Track Donation
          </a>
        </div>
      </div>

      {/* Recent Donations Table */}
      <RecentDonationTable />
    </>
  );
}
