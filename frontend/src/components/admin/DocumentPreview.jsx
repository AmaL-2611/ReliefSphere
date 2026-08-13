function DocumentPreview({ documentPath }) {
  if (!documentPath) {
    return (
      <div className="no-document">No verification document uploaded.</div>
    );
  }

  const fileUrl = "http://localhost:5000/" + documentPath.replace(/\\/g, "/");

  const fileName = documentPath.split(/[\\/]/).pop();

  return (
    <div className="document-card">
      <div className="document-info">
        <h5>📄 {fileName}</h5>

        <p>Verification Document (PDF)</p>
      </div>

      <div className="document-actions">
        <a href={fileUrl} target="_blank" rel="noreferrer" className="view-btn">
          👁 View Document
        </a>

        <a href={fileUrl} download className="download-btn">
          ⬇ Download
        </a>
      </div>
    </div>
  );
}

export default DocumentPreview;
