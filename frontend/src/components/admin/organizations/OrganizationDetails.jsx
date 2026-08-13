import DocumentPreview from "../DocumentPreview";
import "../../../styles/admin/organizationDetails.css";

function OrganizationDetails({ organization, onClose, onApprove, onReject }) {
  return (
    <div className="organization-details-overlay" onClick={onClose}>
      <div className="organization-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}

        <div className="details-header">
          <div>
            <h2>Organization Verification</h2>
            <p>Review organization details and verification documents.</p>
          </div>

          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Scrollable Body */}

        <div className="details-body">
          {/* Applicant */}

          <div className="details-section">
            <h4>Applicant Information</h4>

            <div className="info-row">
              <span>Name</span>
              <strong>{organization.orgName}</strong>
            </div>

            <div className="info-row">
              <span>Email</span>
              <strong>{organization.userId?.email}</strong>
            </div>

            <div className="info-row">
              <span>Submitted</span>
              <strong>
                {new Date(organization.createdAt).toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Organization */}

          <div className="details-section">
            <h4>Organization Details</h4>

            <div className="info-row">
              <span>Organization Type</span>
              <strong>{organization.orgType}</strong>
            </div>

            <div className="info-row">
              <span>Registration No.</span>
              <strong>{organization.registrationNumber}</strong>
            </div>

            <div className="info-row">
              <span>Address</span>
              <strong>{organization.address}</strong>
            </div>

            <div className="info-row">
              <span>Status</span>

              <span
                className={`status-badge ${organization.verificationStatus}`}
              >
                {organization.verificationStatus}
              </span>
            </div>

            {organization.verificationStatus === "rejected" &&
              organization.rejectionReason && (
                <div className="info-row">
                  <span>Reason</span>

                  <div className="rejection-reason">
                    {organization.rejectionReason}
                  </div>
                </div>
              )}
          </div>

          {/* Document */}

          <div className="details-section">
            <h4>Verification Document</h4>

            <DocumentPreview
              documentPath={organization.verificationDocs?.[0]}
            />
          </div>
        </div>

        {/* Footer */}

        <div className="details-footer">
          {organization.verificationStatus === "pending" ? (
            <>
              <button
                className="reject-btn"
                onClick={() => onReject(organization)}
              >
                Reject
              </button>

              <button
                className="approve-btn"
                onClick={() => onApprove(organization._id)}
              >
                Approve
              </button>
            </>
          ) : organization.verificationStatus === "verified" ? (
            <div className="status-message approved-message">
              ✅ This organization has already been approved.
            </div>
          ) : (
            <div className="status-message rejected-message">
              ❌ This organization has already been rejected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrganizationDetails;
