import Badge from "../common/badge";
import "../../../styles/admin/organizationTable.css";

function OrganizationTable({ organizations, onView }) {
  return (
    <div className="organization-table-card">
      <table className="organization-table">
        <thead>
          <tr>
            <th>Organization</th>
            <th>Type</th>
            <th>Status</th>
            <th>Submitted</th>
            <th className="action-column">Action</th>
          </tr>
        </thead>

        <tbody>
          {organizations.length === 0 ? (
            <tr>
              <td colSpan="5">
                <div className="empty-state">
                  <div className="empty-icon">🏢</div>

                  <h3>No Organizations Found</h3>

                  <p>
                    There are no organizations matching the selected filter.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            organizations.map((org) => (
              <tr key={org._id}>
                <td>
                  <div className="organization-cell">
                    <div className="organization-avatar">
                      {org.orgName?.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="organization-name">{org.orgName}</div>

                      <div className="organization-email">
                        {org.userId?.email}
                      </div>
                    </div>
                  </div>
                </td>

                <td>{org.orgType}</td>

                <td>
                  <Badge status={org.verificationStatus} />
                </td>

                <td>
                  <>
                    <div>
                      {new Date(org.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>

                    <small style={{ color: "#64748b" }}>
                      {new Date(org.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </>
                </td>
                <td className="action-column">
                  <button className="view-btn" onClick={() => onView(org)}>
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

export default OrganizationTable;
