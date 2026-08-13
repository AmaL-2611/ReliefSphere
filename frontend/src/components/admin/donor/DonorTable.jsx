import "../../../styles/admin/organizationTable.css";

function DonorTable({ donors, onView }) {
  return (
    <div className="organization-table-card">
      <table className="organization-table">
        <thead>
          <tr>
            <th>Donor</th>
            <th>Type</th>
            <th>Categories</th>
            <th>Registered</th>
            <th className="action-column">Action</th>
          </tr>
        </thead>

        <tbody>
          {donors.length === 0 ? (
            <tr>
              <td colSpan="5">
                <div className="empty-state">
                  <div className="empty-icon">🎁</div>

                  <h3>No Donors Found</h3>

                  <p>No donors match the selected filter.</p>
                </div>
              </td>
            </tr>
          ) : (
            donors.map((donor) => (
              <tr key={donor._id}>
                <td>
                  <div className="organization-cell">
                    <div className="organization-avatar">
                      {donor.userId?.fullName?.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="organization-name">
                        {donor.userId?.fullName}
                      </div>

                      <div className="organization-email">
                        {donor.userId?.email}
                      </div>
                    </div>
                  </div>
                </td>

                <td>{donor.donorType.replace("_", " ")}</td>

                <td>{donor.preferredCategories.join(", ")}</td>

                <td>
                  <>
                    <div>
                      {new Date(donor.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>

                    <small style={{ color: "#64748b" }}>
                      {new Date(donor.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </>
                </td>

                <td className="action-column">
                  <button className="view-btn" onClick={() => onView(donor)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DonorTable;
