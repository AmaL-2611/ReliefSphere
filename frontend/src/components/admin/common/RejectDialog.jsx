import { useState } from "react";
import "../../../styles/admin/RejectDialog.css";

function RejectDialog({
  open,
  title = "Reject Organization",
  onClose,
  onConfirm,
}) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  const handleReject = () => {
    if (!reason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    onConfirm(reason);
    setReason("");
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <h2>{title}</h2>

        <p>This reason will be sent to the applicant by email.</p>

        <textarea
          rows="5"
          placeholder="Enter rejection reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="dialog-actions">
          <button
            className="cancel-btn"
            onClick={() => {
              setReason("");
              onClose();
            }}
          >
            Cancel
          </button>

          <button className="danger-btn" onClick={handleReject}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default RejectDialog;
