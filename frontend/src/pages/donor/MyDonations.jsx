import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SAMPLE_DONATIONS = [
  { id: 1, name: "Food Package", type: "Food", quantity: 25, date: "2026-08-10", status: "Pending" },
  { id: 2, name: "Books Bundle", type: "Books", quantity: 50, date: "2026-08-08", status: "Accepted" },
  { id: 3, name: "Clothes Pack", type: "Clothes", quantity: 30, date: "2026-08-05", status: "Delivered" },
  { id: 4, name: "Grocery Kit", type: "Food", quantity: 15, date: "2026-08-12", status: "Pending" },
  { id: 5, name: "Medical Kits", type: "Medicine", quantity: 10, date: "2026-07-30", status: "Delivered" },
  { id: 6, name: "Stationery Set", type: "Books", quantity: 100, date: "2026-07-20", status: "Cancelled" },
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

export default function MyDonations() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState(SAMPLE_DONATIONS);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDelete = (id) => {
    setDonations((prev) => prev.filter((d) => d.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">My Donations</h1>
        <p className="page-subtitle">Track and manage all your donations submitted via ReliefSphere AI.</p>
      </div>

      {/* Summary Row */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total", value: donations.length, color: "#10b981", bg: "#d1fae5" },
          { label: "Pending", value: donations.filter((d) => d.status === "Pending").length, color: "#ea580c", bg: "#fff7ed" },
          { label: "Accepted", value: donations.filter((d) => d.status === "Accepted").length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Delivered", value: donations.filter((d) => d.status === "Delivered").length, color: "#16a34a", bg: "#f0fdf4" },
        ].map((s) => (
          <div key={s.label} style={{
            background: s.bg,
            color: s.color,
            padding: "10px 20px",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>{s.value}</span>
            <span style={{ fontWeight: 500, fontSize: 13, opacity: 0.85 }}>{s.label}</span>
          </div>
        ))}

        <button
          className="btn-submit"
          style={{ marginLeft: "auto", padding: "10px 20px", fontSize: 13 }}
          onClick={() => navigate("/donor/create-donation")}
          id="add-new-donation-btn"
        >
          ➕ New Donation
        </button>
      </div>

      {/* Donations Table */}
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <span className="section-card-title-dot" />
            All Donations
          </div>
        </div>
        <div className="section-card-body">
          {donations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-text">No donations found</div>
              <div className="empty-state-sub">Create your first donation to get started</div>
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
                  <th>Actions</th>
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
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="action-btn action-btn-view"
                          id={`view-btn-${d.id}`}
                          onClick={() => navigate(`/donor/track-donation?id=${d.id}`)}
                        >
                          👁 View
                        </button>
                        <button
                          className="action-btn action-btn-delete"
                          id={`delete-btn-${d.id}`}
                          disabled={d.status !== "Pending"}
                          onClick={() => setDeleteConfirm(d.id)}
                          title={d.status !== "Pending" ? "Can only delete Pending donations" : "Delete"}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999,
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              background: "white", borderRadius: 16, padding: 28,
              maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <h3 style={{ textAlign: "center", marginBottom: 8, color: "#1e293b" }}>Delete Donation?</h3>
            <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, marginBottom: 24 }}>
              This action cannot be undone. The donation will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="btn-change-pw"
                style={{ flex: 1 }}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1, padding: "11px 0", background: "#ef4444",
                  color: "white", border: "none", borderRadius: 10,
                  fontWeight: 600, cursor: "pointer",
                }}
                id="confirm-delete-btn"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
