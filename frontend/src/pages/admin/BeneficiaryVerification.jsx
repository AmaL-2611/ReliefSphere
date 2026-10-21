import { useState, useEffect } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaClock,
  FaEye,
  FaFileAlt,
  FaBuilding,
  FaUserCheck,
  FaSearch,
} from "react-icons/fa";

export default function BeneficiaryVerification() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [search, setSearch] = useState("");

  // Review Modal State
  const [selectedCase, setSelectedCase] = useState(null);
  const [reviewDecision, setReviewDecision] = useState("approved"); // 'approved' | 'rejected' | 'additional_info_required'
  const [decisionNotes, setDecisionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await API.get(`/beneficiaries/admin/pending?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCases(res.data.cases || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load verification queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter]);

  const handleOpenReview = (c) => {
    setSelectedCase(c);
    setReviewDecision("approved");
    setDecisionNotes("");
    setRejectionReason("");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewDecision === "rejected" && !rejectionReason.trim()) {
      return toast.warning("Rejection reason is mandatory when rejecting a beneficiary case.");
    }
    if (reviewDecision === "additional_info_required" && !decisionNotes.trim()) {
      return toast.warning("Please specify what additional information is required from the NGO.");
    }

    try {
      setReviewing(true);
      const token = localStorage.getItem("token");
      const res = await API.put(
        `/beneficiaries/${selectedCase._id}/admin-review`,
        {
          decision: reviewDecision,
          decisionNotes,
          rejectionReason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data.message || "Review decision recorded successfully!");
      setSelectedCase(null);
      fetchCases();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit review decision.");
    } finally {
      setReviewing(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.caseNumber?.toLowerCase().includes(q) ||
      c.headOfHouseholdName?.toLowerCase().includes(q) ||
      c.organizationId?.orgName?.toLowerCase().includes(q) ||
      c.area?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1400, margin: "0 auto" }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
          Beneficiary Case Verification & Oversight
        </h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
          Independent administrative review and audit of household assistance assessments submitted by registered NGOs.
        </p>
      </div>

      {/* ── Filter Bar ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          padding: 16,
          border: "1px solid #e2e8f0",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Status Pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "pending_review", label: "Pending Review" },
            { id: "verified", label: "Verified Cases" },
            { id: "additional_info_required", label: "Info Required" },
            { id: "rejected", label: "Rejected" },
            { id: "all", label: "All Cases" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                background: statusFilter === pill.id ? "#0891b2" : "#f1f5f9",
                color: statusFilter === pill.id ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", minWidth: 260 }}>
          <FaSearch style={{ position: "absolute", left: 12, top: 12, color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search by case #, NGO, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
            }}
          />
        </div>
      </div>

      {/* ── Cases Table ── */}
      <div style={{ background: "#ffffff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading verification records...</div>
        ) : filteredCases.length === 0 ? (
          <div style={{ padding: 50, textAlign: "center", color: "#64748b" }}>
            <FaUserCheck style={{ fontSize: 40, color: "#cbd5e1", marginBottom: 10 }} />
            <h3 style={{ fontSize: 16, color: "#334155", margin: 0 }}>No Cases Found</h3>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
              There are no beneficiary cases matching the selected filter.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Case Ref</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Submitting NGO</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Beneficiary / Household</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Location Area</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Priority</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Assessed Items</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700, textAlign: "right" }}>Review Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr
                    key={c._id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                  >
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0891b2" }}>
                      {c.caseNumber}
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
                        <FaBuilding style={{ color: "#0891b2" }} /> {c.organizationId?.orgName || "Unknown NGO"}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Staff: {c.createdBy?.fullName || c.createdBy?.email}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#1e293b" }}>{c.headOfHouseholdName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Household Size: {c.householdSize}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px", color: "#334155" }}>{c.area}</td>

                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          background:
                            c.priority === "critical"
                              ? "#fee2e2"
                              : c.priority === "high"
                              ? "#ffedd5"
                              : "#fef3c7",
                          color:
                            c.priority === "critical"
                              ? "#991b1b"
                              : c.priority === "high"
                              ? "#c2410c"
                              : "#92400e",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {c.priority}
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                      {c.neededItems?.map((item, idx) => (
                        <div key={idx} style={{ fontSize: 12 }}>
                          • {item.itemName} ({item.quantityNeeded} {item.unit})
                        </div>
                      ))}
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          background:
                            c.status === "verified"
                              ? "#e0f2fe"
                              : c.status === "rejected"
                              ? "#fee2e2"
                              : c.status === "additional_info_required"
                              ? "#ffedd5"
                              : "#fef3c7",
                          color:
                            c.status === "verified"
                              ? "#0369a1"
                              : c.status === "rejected"
                              ? "#dc2626"
                              : c.status === "additional_info_required"
                              ? "#c2410c"
                              : "#d97706",
                          padding: "4px 9px",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => handleOpenReview(c)}
                        style={{
                          padding: "6px 14px",
                          background: "#0891b2",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <FaEye /> Review Case
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: ADMIN REVIEW DECISION ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {selectedCase && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 750,
              maxHeight: "92vh",
              overflowY: "auto",
              padding: 28,
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Admin Assessment Review: {selectedCase.caseNumber}
                </h2>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
                  Submitting NGO: <strong>{selectedCase.organizationId?.orgName}</strong>
                </div>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                style={{ background: "none", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Case Assessment Summary */}
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 12,
                padding: 16,
                border: "1px solid #e2e8f0",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13, marginBottom: 12 }}>
                <div>Head of Household: <strong>{selectedCase.headOfHouseholdName}</strong></div>
                <div>Contact: <strong>{selectedCase.contactPhone || "Not provided"}</strong></div>
                <div>Location / Area: <strong>{selectedCase.area}</strong></div>
                <div>Household Size: <strong>{selectedCase.householdSize}</strong></div>
                <div>
                  Request Source: <strong>{selectedCase.requestSource?.replace(/_/g, " ")}</strong>
                </div>
                <div>
                  Priority: <strong style={{ textTransform: "uppercase" }}>{selectedCase.priority}</strong>
                </div>
              </div>

              {selectedCase.assessmentRationale && (
                <div style={{ fontSize: 13, color: "#334155", marginTop: 8, padding: "8px 12px", background: "#fff", borderRadius: 8 }}>
                  <strong>Field Assessment Rationale:</strong> {selectedCase.assessmentRationale}
                </div>
              )}

              {/* Supporting Evidence */}
              {selectedCase.supportingEvidence?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                    Supporting Field Evidence Files:
                  </div>
                  {selectedCase.supportingEvidence.map((ev, idx) => (
                    <div key={idx} style={{ display: "inline-block", marginRight: 8 }}>
                      <a
                        href={`http://localhost:5000${ev.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#e0f2fe",
                          color: "#0369a1",
                          padding: "5px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        <FaFileAlt /> View Evidence Document
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assessed Needed Items */}
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
              Assessed Household Relief Requirements:
            </h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 20 }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                  <th style={{ padding: 8 }}>Item Name</th>
                  <th style={{ padding: 8 }}>Category</th>
                  <th style={{ padding: 8 }}>Quantity Assessed</th>
                  <th style={{ padding: 8 }}>Unit</th>
                </tr>
              </thead>
              <tbody>
                {selectedCase.neededItems?.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{item.itemName}</td>
                    <td style={{ padding: 8, textTransform: "capitalize" }}>{item.category}</td>
                    <td style={{ padding: 8, fontWeight: 700, color: "#0891b2" }}>{item.quantityNeeded}</td>
                    <td style={{ padding: 8 }}>{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Decision Form */}
            <form onSubmit={handleSubmitReview}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                  Administrative Verification Decision *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("approved")}
                    style={{
                      padding: "12px",
                      borderRadius: 10,
                      border: reviewDecision === "approved" ? "2px solid #059669" : "1px solid #cbd5e1",
                      background: reviewDecision === "approved" ? "#ecfdf5" : "#ffffff",
                      color: reviewDecision === "approved" ? "#065f46" : "#475569",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <FaCheckCircle /> Approve & Verify
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision("additional_info_required")}
                    style={{
                      padding: "12px",
                      borderRadius: 10,
                      border: reviewDecision === "additional_info_required" ? "2px solid #d97706" : "1px solid #cbd5e1",
                      background: reviewDecision === "additional_info_required" ? "#fffbeb" : "#ffffff",
                      color: reviewDecision === "additional_info_required" ? "#92400e" : "#475569",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <FaExclamationTriangle /> Request More Info
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision("rejected")}
                    style={{
                      padding: "12px",
                      borderRadius: 10,
                      border: reviewDecision === "rejected" ? "2px solid #dc2626" : "1px solid #cbd5e1",
                      background: reviewDecision === "rejected" ? "#fee2e2" : "#ffffff",
                      color: reviewDecision === "rejected" ? "#991b1b" : "#475569",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <FaTimesCircle /> Reject Assessment
                  </button>
                </div>
              </div>

              {reviewDecision === "rejected" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>
                    Rejection Reason *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Specify why this case is rejected (e.g. duplicate household claim; outside jurisdiction)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #f87171", fontSize: 13 }}
                    required
                  />
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Admin Review Notes (Logged in permanent audit trail)
                </label>
                <textarea
                  rows={2}
                  placeholder="Record verification methodology, ration card cross-check, or NGO instructions..."
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 8,
                    border: "none",
                    background: reviewDecision === "approved" ? "#059669" : reviewDecision === "rejected" ? "#dc2626" : "#d97706",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {reviewing ? "Recording Decision..." : "Submit Review Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
