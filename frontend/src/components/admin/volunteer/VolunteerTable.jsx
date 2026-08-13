import Badge from "../common/badge";
import "../../../styles/admin/organizationTable.css";

function VolunteerTable({ volunteers, onView }) {
  return (
    <div className="organization-table-card">
      <table className="organization-table">
        <thead>
          <tr>
            <th>Volunteer</th>
            <th>Phone</th>
            <th>Availability</th>
            <th>Status</th>
            <th>Applied On</th>
            <th className="action-column">Action</th>
          </tr>
        </thead>

        <tbody>
          {volunteers.length === 0 ? (
            <tr>
              <td colSpan="6">
                <div className="empty-state">
                  <div className="empty-icon">🙋</div>

                  <h3>No Volunteers Found</h3>

                  <p>There are no volunteers matching the selected filter.</p>
                </div>
              </td>
            </tr>
          ) : (
            volunteers.map((volunteer) => (
              <tr key={volunteer._id}>
                <td>
                  <div className="organization-cell">
                    <div className="organization-avatar">
                      {volunteer.userId?.fullName?.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="organization-name">
                        {volunteer.userId?.fullName}
                      </div>

                      <div className="organization-email">
                        {volunteer.userId?.email}
                      </div>
                    </div>
                  </div>
                </td>

                <td>{volunteer.phone}</td>

                <td>{volunteer.availability}</td>

                <td>
                  <Badge status={volunteer.verificationStatus} />
                </td>

                <td>
                  <div>
                    {new Date(volunteer.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  <small style={{ color: "#64748b" }}>
                    {new Date(volunteer.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </td>

                <td className="action-column">
                  <button
                    className="view-btn"
                    onClick={() => onView(volunteer)}
                  >
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

export default VolunteerTable;
