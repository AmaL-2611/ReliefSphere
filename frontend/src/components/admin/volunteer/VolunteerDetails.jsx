import DocumentPreview from "../DocumentPreview";
import "../../../styles/admin/volunteerDetails.css";

function VolunteerDetails({ volunteer, onClose, onApprove, onReject }) {
  return (
    <div className="organization-details-overlay" onClick={onClose}>
      <div className="organization-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}

        <div className="details-header">
          <div>
            <h2>Volunteer Verification</h2>

            <p>Review volunteer information and identity document.</p>
          </div>

          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}

        <div className="details-body">
          {/* Volunteer */}

          <div className="details-section">
            <h4>Volunteer Information</h4>

            <div className="info-row">
              <span>Name</span>

              <strong>{volunteer.userId?.fullName}</strong>
            </div>

            <div className="info-row">
              <span>Email</span>

              <strong>{volunteer.userId?.email}</strong>
            </div>

            <div className="info-row">
              <span>Phone</span>

              <strong>{volunteer.phone || volunteer.userId?.phone}</strong>
            </div>

            <div className="info-row">
              <span>Date of Birth</span>

              <strong>{new Date(volunteer.dob).toLocaleDateString()}</strong>
            </div>

            <div className="info-row">
              <span>Applied On</span>

              <strong>{new Date(volunteer.createdAt).toLocaleString()}</strong>
            </div>
          </div>

          {/* Details */}

          <div className="details-section">
            <h4>Volunteer Details</h4>

            <div className="info-row">
              <span>Address</span>

              <strong>{volunteer.address}</strong>
            </div>

            <div className="info-row">
              <span>Completed Deliveries</span>

              <strong>{volunteer.completedDeliveries}</strong>
            </div>
            <div className="info-row">
              <span>Skills</span>

              <strong>
                {volunteer.skills && volunteer.skills.length > 0
                  ? volunteer.skills.join(", ")
                  : "Not specified"}
              </strong>
            </div>
            <div className="info-row">
              <span>Status</span>

              <span className={`status-badge ${volunteer.verificationStatus}`}>
                {volunteer.verificationStatus}
              </span>
            </div>

            {volunteer.verificationStatus === "rejected" &&
              volunteer.rejectionReason && (
                <div className="info-row">
                  <span>Reason</span>

                  <div className="rejection-reason">
                    {volunteer.rejectionReason}
                  </div>
                </div>
              )}
          </div>

          {/* Document */}

          <div className="details-section">
            <h4>ID Document</h4>

            <DocumentPreview documentPath={volunteer.idDocument} />
          </div>
        </div>

        {/* Footer */}

        <div className="details-footer">
          {volunteer.verificationStatus === "pending" ? (
            <>
              <button
                className="reject-btn"
                onClick={() => onReject(volunteer)}
              >
                Reject
              </button>

              <button
                className="approve-btn"
                onClick={() => onApprove(volunteer._id)}
              >
                Approve
              </button>
            </>
          ) : volunteer.verificationStatus === "verified" ? (
            <div className="status-message approved-message">
              ✅ This volunteer has already been approved.
            </div>
          ) : (
            <div className="status-message rejected-message">
              ❌ This volunteer has already been rejected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VolunteerDetails;
