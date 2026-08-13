const RECENT_DONATIONS = [
  { id: 1, name: "Food Package", type: "Food", quantity: 25, status: "Pending", date: "2026-08-10" },
  { id: 2, name: "Books Bundle", type: "Books", quantity: 50, status: "Accepted", date: "2026-08-08" },
  { id: 3, name: "Clothes Pack", type: "Clothes", quantity: 30, status: "Delivered", date: "2026-08-05" },
  { id: 4, name: "Grocery Kit", type: "Food", quantity: 15, status: "Pending", date: "2026-08-12" },
];

function StatusBadge({ status }) {
  const cls = {
    Pending: "status-badge status-pending",
    Accepted: "status-badge status-accepted",
    Delivered: "status-badge status-delivered",
    Cancelled: "status-badge status-cancelled",
  }[status] || "status-badge";
  return <span className={cls}>{status}</span>;
}

export default function RecentDonationTable({ donations = RECENT_DONATIONS }) {
  return (
    <div className="section-card">
      <div className="section-card-header">
        <div className="section-card-title">
          <span className="section-card-title-dot" />
          Recent Donations
        </div>
      </div>
      <div className="section-card-body">
        {donations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-text">No donations yet</div>
            <div className="empty-state-sub">Start by creating your first donation</div>
          </div>
        ) : (
          <table className="donor-table">
            <thead>
              <tr>
                <th>Donation Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td>{d.type}</td>
                  <td>{d.quantity}</td>
                  <td style={{ color: "#64748b" }}>{d.date}</td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
