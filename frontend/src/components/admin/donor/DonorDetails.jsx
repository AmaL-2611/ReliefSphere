import "../../../styles/admin/organizationDetails.css";

function DonorDetails({ donor, onClose }) {
  return (
    <div className="organization-details-overlay" onClick={onClose}>
      <div className="organization-modal" onClick={(e) => e.stopPropagation()}>
        <div className="details-header">
          <div>
            <h2>Donor Information</h2>

            <p>Registered donor profile.</p>
          </div>

          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="details-body">
          <div className="details-section">
            <h4>Basic Information</h4>

            <div className="info-row">
              <span>Name</span>

              <strong>{donor.userId?.fullName}</strong>
            </div>

            <div className="info-row">
              <span>Email</span>

              <strong>{donor.userId?.email}</strong>
            </div>

            <div className="info-row">
              <span>Phone</span>

              <strong>{donor.userId?.phone}</strong>
            </div>

            <div className="info-row">
              <span>Registered</span>

              <strong>{new Date(donor.createdAt).toLocaleString()}</strong>
            </div>
          </div>

          <div className="details-section">
            <h4>Donation Details</h4>

            <div className="info-row">
              <span>Donor Type</span>

              <strong>{donor.donorType.replace("_", " ")}</strong>
            </div>

            <div className="info-row">
              <span>Preferred Categories</span>

              <strong>{donor.preferredCategories.join(", ")}</strong>
            </div>

            <div className="info-row">
              <span>Address</span>

              <strong>{donor.address}</strong>
            </div>

            <div className="info-row">
              <span>Total Donations</span>

              <strong>{donor.totalDonations}</strong>
            </div>
          </div>
        </div>

        <div className="details-footer">
          <div className="status-message approved-message">
            👤 Registered donor account
          </div>
        </div>
      </div>
    </div>
  );
}

export default DonorDetails;
