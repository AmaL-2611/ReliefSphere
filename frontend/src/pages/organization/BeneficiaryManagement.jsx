import { useState, useEffect } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";
import {
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTimesCircle,
  FaBoxOpen,
  FaPlus,
  FaSearch,
  FaFilter,
  FaFileAlt,
  FaHandsHelping,
  FaTruck,
  FaEye,
  FaCheck,
  FaTimes,
  FaHistory,
  FaLink,
} from "react-icons/fa";

export default function BeneficiaryManagement() {
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    pendingReview: 0,
    verified: 0,
    inProgress: 0,
    followUpRequired: 0,
    closed: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [requestSourceFilter, setRequestSourceFilter] = useState("all");

  // Modals & Drawers
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState("needs"); // 'needs' | 'distributions' | 'traceability' | 'followup'

  // Record Distribution Modal
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [distributeForm, setDistributeForm] = useState({
    category: "food",
    itemName: "",
    quantityDistributed: "",
    unit: "Items",
    distributionDate: new Date().toISOString().split("T")[0],
    distributionMethod: "direct_ngo_handover",
    relatedDonationId: "",
    relatedDeliveryId: "",
    recipientName: "",
    relationshipToHead: "Self",
    notes: "",
  });

  // Follow-up & Close forms
  const [followUpFinding, setFollowUpFinding] = useState("");
  const [followUpAction, setFollowUpAction] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [unmetRationale, setUnmetRationale] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Dispute modal
  const [disputeDistId, setDisputeDistId] = useState(null);
  const [disputeNotes, setDisputeNotes] = useState("");

  // New Case Registration Form State
  const initialNewCaseState = {
    headOfHouseholdName: "",
    contactPhone: "",
    householdSize: 1,
    children: 0,
    elderly: 0,
    disabled: 0,
    pregnantOrLactating: 0,
    area: "",
    address: "",
    priority: "medium",
    requestSource: "ngo_field_assessment",
    beneficiaryType: "household",
    assessmentDate: new Date().toISOString().split("T")[0],
    assessmentRationale: "",
    assessmentNotes: "",
    neededItems: [{ category: "food", itemName: "", quantityNeeded: "", unit: "Kits", urgency: "medium" }],
    evidenceFile: null,
    isDraft: false,
  };
  const [newCase, setNewCase] = useState(initialNewCaseState);
  const [submittingCase, setSubmittingCase] = useState(false);

  const getItemPlaceholder = (category) => {
    switch (category) {
      case "food":
        return "e.g. Dry Ration Kit, Rice (Kg), Baby Milk Powder, Wheat Flour";
      case "clothing":
        return "e.g. Warm Blankets, Winter Clothes, Children's Wear";
      case "shelter":
        return "e.g. Tarpaulin Sheets, Bedding Mats, Tent Supplies";
      case "medical":
        return "e.g. First Aid Kits, ORS Packets, Insulin, Antiseptics";
      case "education":
        return "e.g. School Bags, Notebooks, Stationery Kits";
      case "hygiene":
        return "e.g. Sanitary Pads, Bath Soaps, Disinfectant, Toothpaste";
      default:
        return "e.g. Essential Relief Supplies";
    }
  };

  // Fetch Cases and Stats
  const fetchCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (requestSourceFilter !== "all") params.append("requestSource", requestSourceFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await API.get(`/beneficiaries?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCases(res.data.cases || []);
      setStats(res.data.stats || {});
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load beneficiary cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, priorityFilter, requestSourceFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCases();
  };

  // Open Case Details
  const handleOpenDetails = async (caseId) => {
    try {
      setSelectedCaseId(caseId);
      setDetailsLoading(true);
      const token = localStorage.getItem("token");
      const res = await API.get(`/beneficiaries/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCaseDetails(res.data);
      setDetailsTab("needs");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load case details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  // Register Case item changes
  const handleItemChange = (index, field, value) => {
    const updated = [...newCase.neededItems];
    updated[index][field] = value;
    setNewCase({ ...newCase, neededItems: updated });
  };

  const handleAddItem = () => {
    setNewCase({
      ...newCase,
      neededItems: [
        ...newCase.neededItems,
        { category: "food", itemName: "", quantityNeeded: "", unit: "Items", urgency: "medium" },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    if (newCase.neededItems.length <= 1) return;
    const updated = newCase.neededItems.filter((_, i) => i !== index);
    setNewCase({ ...newCase, neededItems: updated });
  };

  // Submit Beneficiary Case
  const handleRegisterCase = async (isDraftMode = false) => {
    if (!newCase.headOfHouseholdName.trim()) {
      return toast.warning("Head of Household / Beneficiary Name is required.");
    }
    if (newCase.contactPhone && newCase.contactPhone.trim()) {
      const cleanPhone = newCase.contactPhone.trim().replace(/\D/g, "");
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return toast.warning("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
      }
    }
    if (!newCase.area.trim()) {
      return toast.warning("General location / area is required.");
    }
    for (const item of newCase.neededItems) {
      if (!item.itemName.trim() || Number(item.quantityNeeded) <= 0) {
        return toast.warning("Please specify a valid item name and quantity for all needed items.");
      }
    }

    try {
      setSubmittingCase(true);
      const token = localStorage.getItem("token");

      let supportingEvidence = [];
      if (newCase.evidenceFile) {
        const formData = new FormData();
        formData.append("file", newCase.evidenceFile);
        const upRes = await API.post("/beneficiaries/upload-evidence", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        const isPhoto = /\.(jpe?g|png|webp|gif)$/i.test(newCase.evidenceFile.name);
        supportingEvidence.push({
          evidenceType: isPhoto ? "field_photo" : "assessment_document",
          fileUrl: upRes.data.url,
          description: isPhoto ? "Field assessment photo of beneficiary household." : "Field assessment document or supporting evidence.",
        });
      }

      const payload = {
        requestSource: newCase.requestSource,
        beneficiaryType: newCase.beneficiaryType,
        headOfHouseholdName: newCase.headOfHouseholdName,
        contactPhone: newCase.contactPhone,
        householdSize: Number(newCase.householdSize) || 1,
        vulnerableMembers: {
          children: Number(newCase.children) || 0,
          elderly: Number(newCase.elderly) || 0,
          disabled: Number(newCase.disabled) || 0,
          pregnantOrLactating: Number(newCase.pregnantOrLactating) || 0,
        },
        area: newCase.area,
        address: newCase.address,
        priority: newCase.priority,
        assessmentDate: newCase.assessmentDate,
        assessmentRationale: newCase.assessmentRationale,
        assessmentNotes: newCase.assessmentNotes,
        neededItems: newCase.neededItems.map((i) => ({
          ...i,
          quantityNeeded: Number(i.quantityNeeded),
        })),
        supportingEvidence,
        isDraft: isDraftMode,
      };

      const res = await API.post("/beneficiaries", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(res.data.message || "Beneficiary case registered successfully!");
      setShowRegisterModal(false);
      setNewCase(initialNewCaseState);
      fetchCases();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to register beneficiary case.");
    } finally {
      setSubmittingCase(false);
    }
  };

  // Open Record Distribution Modal
  const handleOpenDistribute = (item = null) => {
    setDistributeForm({
      category: item ? item.category : "food",
      itemName: item ? item.itemName : "",
      quantityDistributed: item ? item.quantityRemaining || item.remainingQuantity || "" : "",
      unit: item ? item.unit : "Items",
      distributionDate: new Date().toISOString().split("T")[0],
      distributionMethod: "direct_ngo_handover",
      relatedDonationId: "",
      relatedDeliveryId: "",
      recipientName: caseDetails?.case?.headOfHouseholdName || "",
      relationshipToHead: "Self",
      notes: "",
    });
    setShowDistributeModal(true);
  };

  // Submit Distribution Record
  const handleSubmitDistribution = async (e) => {
    e.preventDefault();
    if (!distributeForm.itemName.trim()) {
      return toast.warning("Item name is required.");
    }
    if (Number(distributeForm.quantityDistributed) <= 0) {
      return toast.warning("Quantity distributed must be greater than zero.");
    }

    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        `/beneficiaries/${selectedCaseId}/distribute`,
        {
          category: distributeForm.category,
          itemName: distributeForm.itemName,
          quantityDistributed: Number(distributeForm.quantityDistributed),
          unit: distributeForm.unit,
          distributionDate: distributeForm.distributionDate,
          distributionMethod: distributeForm.distributionMethod,
          relatedDonationId: distributeForm.relatedDonationId || undefined,
          relatedDeliveryId: distributeForm.relatedDeliveryId || undefined,
          recipientAcknowledgement: {
            recipientName: distributeForm.recipientName,
            relationshipToHead: distributeForm.relationshipToHead,
            acknowledgementType: "worker_attestation",
            notes: distributeForm.notes,
          },
          notes: distributeForm.notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data.message || "Assistance distribution recorded!");
      setShowDistributeModal(false);
      handleOpenDetails(selectedCaseId);
      fetchCases();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record distribution.");
    }
  };

  // Publish remaining needs as public requirements for donors
  const handlePublishToRequirements = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        `/beneficiaries/${selectedCaseId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "Needs published to Donor Requirements!");
      handleOpenDetails(selectedCaseId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish requirements.");
    }
  };

  // Submit Follow-up Note
  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpFinding.trim()) {
      return toast.warning("Follow-up findings are required.");
    }

    try {
      const token = localStorage.getItem("token");
      await API.post(
        `/beneficiaries/${selectedCaseId}/follow-up`,
        { findings: followUpFinding, actionTaken: followUpAction },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Follow-up assessment note added.");
      setFollowUpFinding("");
      setFollowUpAction("");
      handleOpenDetails(selectedCaseId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add follow-up note.");
    }
  };

  // Submit Case Closure
  const handleCloseCase = async (e) => {
    e.preventDefault();
    if (!closureReason.trim()) {
      return toast.warning("Closure reason is required.");
    }

    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/beneficiaries/${selectedCaseId}/close`,
        { closureReason, unmetNeedsRationale: unmetRationale },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Beneficiary case closed.");
      setShowCloseModal(false);
      setClosureReason("");
      setUnmetRationale("");
      handleOpenDetails(selectedCaseId);
      fetchCases();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to close case.");
    }
  };

  // Submit Dispute Flag
  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeNotes.trim()) return toast.warning("Dispute notes are required.");
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/beneficiaries/distributions/${disputeDistId}/dispute`,
        { disputeNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.warning("Distribution marked as disputed. Case flagged for follow-up review.");
      setDisputeDistId(null);
      setDisputeNotes("");
      handleOpenDetails(selectedCaseId);
      fetchCases();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispute distribution.");
    }
  };

  // Helper Badge Color
  const getStatusBadge = (status) => {
    switch (status) {
      case "verified":
        return { label: "Verified", bg: "#e0f2fe", text: "#0369a1", icon: <FaCheckCircle /> };
      case "assistance_in_progress":
        return { label: "In Progress", bg: "#ecfdf5", text: "#059669", icon: <FaBoxOpen /> };
      case "pending_review":
        return { label: "Pending Admin Review", bg: "#fef3c7", text: "#d97706", icon: <FaClock /> };
      case "additional_info_required":
        return { label: "Info Required", bg: "#ffedd5", text: "#c2410c", icon: <FaExclamationTriangle /> };
      case "follow_up_required":
        return { label: "Follow-Up Needed", bg: "#f3e8ff", text: "#7e22ce", icon: <FaExclamationTriangle /> };
      case "closed":
        return { label: "Closed", bg: "#f1f5f9", text: "#475569", icon: <FaCheck /> };
      case "rejected":
        return { label: "Rejected", bg: "#fee2e2", text: "#dc2626", icon: <FaTimesCircle /> };
      default:
        return { label: status, bg: "#f8fafc", text: "#64748b", icon: <FaClock /> };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "critical":
        return { label: "Critical", bg: "#fee2e2", text: "#991b1b" };
      case "high":
        return { label: "High", bg: "#ffedd5", text: "#c2410c" };
      case "medium":
        return { label: "Medium", bg: "#fef3c7", text: "#92400e" };
      default:
        return { label: "Low", bg: "#f1f5f9", text: "#475569" };
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", paddingBottom: 60 }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
            Verified Beneficiary Assistance & Traceability System
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
            Direct household identification, needs verification, multi-stage delivery traceability, and follow-up.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#0891b2",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(8, 145, 178, 0.3)",
          }}
          id="btn-register-beneficiary"
        >
          <FaPlus /> Register Beneficiary Case
        </button>
      </div>

      {/* ── Metric Summary Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <div style={{ background: "#ffffff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Cases</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{stats.totalCases || 0}</div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 14, padding: "18px 20px", border: "1px solid #fed7aa" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#c2410c", textTransform: "uppercase" }}>Pending Review</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#ea580c", marginTop: 4 }}>{stats.pendingReview || 0}</div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 14, padding: "18px 20px", border: "1px solid #bae6fd" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0284c7", textTransform: "uppercase" }}>Verified Cases</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0284c7", marginTop: 4 }}>{stats.verified || 0}</div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 14, padding: "18px 20px", border: "1px solid #a7f3d0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>In Progress</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#059669", marginTop: 4 }}>{stats.inProgress || 0}</div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e9d5ff" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9333ea", textTransform: "uppercase" }}>Follow-up Needed</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#9333ea", marginTop: 4 }}>{stats.followUpRequired || 0}</div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Closed Cases</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#475569", marginTop: 4 }}>{stats.closed || 0}</div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          padding: 16,
          border: "1px solid #e2e8f0",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, flex: 1, minWidth: 260 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <FaSearch style={{ position: "absolute", left: 12, top: 12, color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search case #, beneficiary name, or area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 14,
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              background: "#0891b2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
          >
            <option value="all">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="verified">Verified</option>
            <option value="assistance_in_progress">Assistance In Progress</option>
            <option value="follow_up_required">Follow-up Required</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={requestSourceFilter}
            onChange={(e) => setRequestSourceFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
          >
            <option value="all">All Request Sources</option>
            <option value="ngo_field_assessment">NGO Field Assessment</option>
            <option value="community_referral">Community Referral</option>
            <option value="household_reported">Household Reported</option>
          </select>
        </div>
      </div>

      {/* ── Beneficiary Cases Table ── */}
      <div style={{ background: "#ffffff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading beneficiary records...</div>
        ) : cases.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <FaUsers style={{ fontSize: 44, color: "#cbd5e1", marginBottom: 12 }} />
            <h3 style={{ fontSize: 18, color: "#334155", margin: 0 }}>No Beneficiary Cases Found</h3>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
              {statusFilter !== "all" || search
                ? "Try adjusting your search criteria or status filter."
                : "Register a household or individual to initiate the verified assistance lifecycle."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Case Ref</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Beneficiary / Household</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Location Area</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Source</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Priority</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700 }}>Needed Items</th>
                  <th style={{ padding: "14px 16px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => {
                  const sBadge = getStatusBadge(c.status);
                  const pBadge = getPriorityBadge(c.priority);
                  return (
                    <tr
                      key={c._id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
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
                        <div style={{ fontWeight: 700, color: "#1e293b" }}>{c.headOfHouseholdName}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          Size: {c.householdSize} • {c.beneficiaryType === "household" ? "Household" : "Individual"}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#334155" }}>{c.area}</td>

                      <td style={{ padding: "14px 16px", color: "#64748b" }}>
                        {c.requestSource === "ngo_field_assessment"
                          ? "Field Assessment"
                          : c.requestSource === "community_referral"
                          ? "Community Referral"
                          : "Household Reported"}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            background: pBadge.bg,
                            color: pBadge.text,
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {pBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            background: sBadge.bg,
                            color: sBadge.text,
                            padding: "4px 9px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          {sBadge.icon} {sBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        {c.neededItems?.slice(0, 2).map((item, idx) => (
                          <div key={idx} style={{ fontSize: 12 }}>
                            • {item.itemName} ({item.quantityNeeded} {item.unit})
                          </div>
                        ))}
                        {c.neededItems?.length > 2 && (
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>+{c.neededItems.length - 2} more</div>
                        )}
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenDetails(c._id)}
                          style={{
                            padding: "6px 12px",
                            background: "#f1f5f9",
                            color: "#0f172a",
                            border: "1px solid #cbd5e1",
                            borderRadius: 6,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <FaEye /> View Case
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 1: REGISTER BENEFICIARY CASE ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {showRegisterModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
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
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Register Beneficiary Assistance Case
                </h2>
                <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0 0" }}>
                  Record assessed household needs. Submission will be audited by Platform Admin before distribution.
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Head of Household / Beneficiary Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newCase.headOfHouseholdName}
                  onChange={(e) => setNewCase({ ...newCase, headOfHouseholdName: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210 (10 digits)"
                  maxLength={10}
                  value={newCase.contactPhone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setNewCase({ ...newCase, contactPhone: digits });
                  }}
                  style={{
                    width: "100%",
                    padding: 9,
                    borderRadius: 8,
                    border: `1px solid ${
                      newCase.contactPhone
                        ? /^[6-9]\d{9}$/.test(newCase.contactPhone)
                          ? "#22c55e"
                          : "#ef4444"
                        : "#cbd5e1"
                    }`,
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                {newCase.contactPhone && (
                  <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600 }}>
                    {/^[6-9]\d{9}$/.test(newCase.contactPhone) ? (
                      <span style={{ color: "#16a34a" }}>✓ Valid 10-digit mobile number</span>
                    ) : (
                      <span style={{ color: "#dc2626" }}>
                        ⚠️ Must be a valid 10-digit mobile number starting with 6, 7, 8, or 9 ({newCase.contactPhone.length}/10)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Request Source *
                </label>
                <select
                  value={newCase.requestSource}
                  onChange={(e) => setNewCase({ ...newCase, requestSource: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                >
                  <option value="ngo_field_assessment">NGO Field Assessment</option>
                  <option value="community_referral">Community Referral</option>
                  <option value="household_reported">Household Reported</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Priority Level *
                </label>
                <select
                  value={newCase.priority}
                  onChange={(e) => setNewCase({ ...newCase, priority: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                >
                  <option value="critical">Critical (Immediate Relief)</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Assessment Date *
                </label>
                <input
                  type="date"
                  value={newCase.assessmentDate}
                  onChange={(e) => setNewCase({ ...newCase, assessmentDate: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Household Total Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={newCase.householdSize}
                  onChange={(e) => setNewCase({ ...newCase, householdSize: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
              </div>
            </div>

            {/* Vulnerability Counts */}
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 10,
                padding: 12,
                border: "1px solid #e2e8f0",
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                Vulnerable Household Members:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Children (&lt;12)</span>
                  <input
                    type="number"
                    min="0"
                    value={newCase.children}
                    onChange={(e) => setNewCase({ ...newCase, children: e.target.value })}
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Elderly (&gt;60)</span>
                  <input
                    type="number"
                    min="0"
                    value={newCase.elderly}
                    onChange={(e) => setNewCase({ ...newCase, elderly: e.target.value })}
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Disabled</span>
                  <input
                    type="number"
                    min="0"
                    value={newCase.disabled}
                    onChange={(e) => setNewCase({ ...newCase, disabled: e.target.value })}
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Pregnant / Nursing</span>
                  <input
                    type="number"
                    min="0"
                    value={newCase.pregnantOrLactating}
                    onChange={(e) => setNewCase({ ...newCase, pregnantOrLactating: e.target.value })}
                    style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  General Area / Settlement *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aluva Riverbank Colony, Ward 4"
                  value={newCase.area}
                  onChange={(e) => setNewCase({ ...newCase, area: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Specific Address (Restricted to Staff/Admin)
                </label>
                <input
                  type="text"
                  placeholder="House # / Landmark"
                  value={newCase.address}
                  onChange={(e) => setNewCase({ ...newCase, address: e.target.value })}
                  style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
              </div>
            </div>

            {/* Dynamic Needed Items */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                  Assessed Relief Requirements *
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{
                    background: "#e0f2fe",
                    color: "#0369a1",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add Item
                </button>
              </div>

              {newCase.neededItems.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "130px 1fr 90px 100px 36px",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <select
                    value={item.category}
                    onChange={(e) => handleItemChange(index, "category", e.target.value)}
                    style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                  >
                    <option value="food">Food</option>
                    <option value="medical">Medical</option>
                    <option value="clothing">Clothing</option>
                    <option value="shelter">Shelter</option>
                    <option value="education">Education</option>
                    <option value="hygiene">Hygiene</option>
                    <option value="other">Other</option>
                  </select>

                  <input
                    type="text"
                    placeholder={getItemPlaceholder(item.category)}
                    value={item.itemName}
                    onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                    style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                    required
                  />

                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantityNeeded}
                    onChange={(e) => handleItemChange(index, "quantityNeeded", e.target.value)}
                    style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                    required
                  />

                  <select
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                    style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                  >
                    <option value="Items">Items</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Kg">Kg</option>
                    <option value="Liters">Liters</option>
                    <option value="Packets">Packets</option>
                    <option value="Kits">Kits</option>
                    <option value="Sets">Sets</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={newCase.neededItems.length <= 1}
                    style={{
                      background: "#fee2e2",
                      color: "#dc2626",
                      border: "none",
                      borderRadius: 6,
                      height: 36,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Assessment Notes & Supporting Evidence */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Assessment Rationale & Vulnerability Notes
              </label>
              <textarea
                rows={2}
                placeholder="Document why this household requires prioritized relief..."
                value={newCase.assessmentRationale}
                onChange={(e) => setNewCase({ ...newCase, assessmentRationale: e.target.value })}
                style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Supporting Evidence / Field Assessment Slip (PDF/Image)
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.webp"
                onChange={(e) => setNewCase({ ...newCase, evidenceFile: e.target.files[0] })}
                style={{ fontSize: 13 }}
              />
              {newCase.evidenceFile && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  {newCase.evidenceFile.type?.startsWith("image/") && (
                    <img
                      src={URL.createObjectURL(newCase.evidenceFile)}
                      alt="Selected Evidence Preview"
                      style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: "1px solid #cbd5e1" }}
                    />
                  )}
                  <span style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>
                    ✓ Selected: {newCase.evidenceFile.name} ({(newCase.evidenceFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRegisterCase(true)}
                disabled={submittingCase}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleRegisterCase(false)}
                disabled={submittingCase}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#0891b2",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {submittingCase ? "Submitting..." : "Submit for Admin Verification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── DRAWER / MODAL 2: CASE DETAILS & TRACEABILITY ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {selectedCaseId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
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
              maxWidth: 900,
              maxHeight: "92vh",
              overflowY: "auto",
              padding: 28,
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
          >
            {detailsLoading || !caseDetails ? (
              <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>Loading case records...</div>
            ) : (
              <>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: 16,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {caseDetails.case.caseNumber}
                      </h2>
                      <span
                        style={{
                          background: getStatusBadge(caseDetails.case.status).bg,
                          color: getStatusBadge(caseDetails.case.status).text,
                          padding: "4px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {getStatusBadge(caseDetails.case.status).label}
                      </span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                      Head of Household: <strong>{caseDetails.case.headOfHouseholdName}</strong> • {caseDetails.case.area} •{" "}
                      Size: {caseDetails.case.householdSize}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {["verified", "assistance_in_progress", "follow_up_required"].includes(caseDetails.case.status) && (
                      <>
                        <button
                          onClick={handlePublishToRequirements}
                          style={{
                            padding: "8px 14px",
                            background: "#0891b2",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          title="Publish remaining needs to donor requirements board"
                        >
                          📢 Publish for Donors
                        </button>
                        <button
                          onClick={() => handleOpenDistribute()}
                          style={{
                            padding: "8px 14px",
                            background: "#059669",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <FaBoxOpen /> Record Distribution
                        </button>
                      </>
                    )}

                    {caseDetails.case.status !== "closed" && (
                      <button
                        onClick={() => setShowCloseModal(true)}
                        style={{
                          padding: "8px 14px",
                          background: "#f1f5f9",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Close Case
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedCaseId(null)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 20,
                        color: "#94a3b8",
                        cursor: "pointer",
                        marginLeft: 10,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #e2e8f0", marginBottom: 20 }}>
                  {[
                    { id: "needs", label: "Needs & Fulfillment", icon: <FaFileAlt /> },
                    { id: "distributions", label: "Assistance Distribution History", icon: <FaHandsHelping /> },
                    { id: "traceability", label: "Resource Traceability", icon: <FaLink /> },
                    { id: "followup", label: "Audit & Follow-Up", icon: <FaHistory /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailsTab(tab.id)}
                      style={{
                        padding: "10px 16px",
                        border: "none",
                        borderBottom: detailsTab === tab.id ? "3px solid #0891b2" : "3px solid transparent",
                        background: "none",
                        color: detailsTab === tab.id ? "#0891b2" : "#64748b",
                        fontWeight: detailsTab === tab.id ? 700 : 500,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB 1: NEEDS & FULFILLMENT */}
                {detailsTab === "needs" && (
                  <div>
                    {/* Overall Progress */}
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 12,
                        padding: 16,
                        border: "1px solid #e2e8f0",
                        marginBottom: 20,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Overall Assessed Need Fulfillment</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#0891b2" }}>
                          {caseDetails.fulfillment?.overallPercentage || 0}% Fulfilled
                        </span>
                      </div>
                      <div style={{ width: "100%", height: 10, background: "#e2e8f0", borderRadius: 5, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${caseDetails.fulfillment?.overallPercentage || 0}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #0891b2, #10b981)",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
                        <span>Total Units Needed: <strong>{caseDetails.fulfillment?.totalNeededUnits}</strong></span>
                        <span>Donated by Donors: <strong style={{ color: "#0284c7" }}>{caseDetails.fulfillment?.totalDonatedUnits || 0}</strong></span>
                        <span>Distributed to Household: <strong style={{ color: "#059669" }}>{caseDetails.fulfillment?.totalDistributedUnits || 0}</strong></span>
                      </div>
                    </div>

                    {/* Item-by-item Table */}
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
                      Item-by-Item Traceability & Remaining Needs
                    </h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 20 }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                          <th style={{ padding: 10 }}>Item</th>
                          <th style={{ padding: 10 }}>Category</th>
                          <th style={{ padding: 10 }}>Assessed Needed</th>
                          <th style={{ padding: 10 }}>Pledged / Donated</th>
                          <th style={{ padding: 10 }}>Distributed</th>
                          <th style={{ padding: 10 }}>Remaining Unmet</th>
                          <th style={{ padding: 10 }}>Status</th>
                          <th style={{ padding: 10, textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseDetails.fulfillment?.itemBreakdown?.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: 10, fontWeight: 700 }}>{item.itemName}</td>
                            <td style={{ padding: 10, textTransform: "capitalize", color: "#64748b" }}>{item.category}</td>
                            <td style={{ padding: 10 }}>{item.quantityNeeded} {item.unit}</td>
                            <td style={{ padding: 10 }}>
                              {item.quantityDonated > 0 ? (
                                <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>
                                  🎁 {item.quantityDonated} {item.unit}
                                </span>
                              ) : (
                                <span style={{ color: "#94a3b8" }}>0 {item.unit}</span>
                              )}
                            </td>
                            <td style={{ padding: 10, color: "#059669", fontWeight: 700 }}>
                              {item.quantityDistributed} {item.unit}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                fontWeight: 700,
                                color: item.quantityRemaining > 0 ? "#dc2626" : "#10b981",
                              }}
                            >
                              {item.quantityRemaining} {item.unit}
                            </td>
                            <td style={{ padding: 10 }}>
                              {item.isFulfilled ? (
                                <span style={{ color: "#059669", fontWeight: 700 }}>Fulfilled ✓</span>
                              ) : (
                                <span style={{ color: "#d97706", fontWeight: 600 }}>{item.fulfillmentPercentage}% Sourced</span>
                              )}
                            </td>
                            <td style={{ padding: 10, textAlign: "right" }}>
                              {!item.isFulfilled &&
                                ["verified", "assistance_in_progress"].includes(caseDetails.case.status) && (
                                  <button
                                    onClick={() => handleOpenDistribute(item)}
                                    style={{
                                      padding: "4px 8px",
                                      background: "#e0f2fe",
                                      color: "#0369a1",
                                      border: "none",
                                      borderRadius: 6,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Distribute
                                  </button>
                                )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Admin Verification Details Box */}
                    {caseDetails.case.verificationDetails?.reviewedAt && (
                      <div
                        style={{
                          background: "#f0fdf4",
                          borderRadius: 10,
                          padding: 14,
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 4 }}>
                          Admin Verification Record:
                        </div>
                        <div style={{ fontSize: 12, color: "#15803d" }}>
                          Reviewed by:{" "}
                          <strong>{caseDetails.case.verificationDetails.reviewedBy?.fullName || "Admin"}</strong> on{" "}
                          {new Date(caseDetails.case.verificationDetails.reviewedAt).toLocaleString()}
                        </div>
                        {caseDetails.case.verificationDetails.decisionNotes && (
                          <div style={{ fontSize: 12, color: "#14532d", marginTop: 4 }}>
                            Notes: "{caseDetails.case.verificationDetails.decisionNotes}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Supporting Evidence / Uploaded Photos & Documents */}
                    {caseDetails.case.supportingEvidence && caseDetails.case.supportingEvidence.length > 0 && (
                      <div style={{ marginTop: 18, background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
                          Field Supporting Evidence & Assessment Photos ({caseDetails.case.supportingEvidence.length})
                        </div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {caseDetails.case.supportingEvidence.map((ev, idx) => {
                            const isPdf = ev.fileUrl && ev.fileUrl.toLowerCase().endsWith(".pdf");
                            const fileUrl = ev.fileUrl?.startsWith("http") ? ev.fileUrl : `http://localhost:5000${ev.fileUrl?.startsWith("/") ? "" : "/"}${ev.fileUrl?.replace(/\\/g, "/")}`;
                            if (isPdf) {
                              return (
                                <a
                                  key={idx}
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 14px",
                                    background: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: 8,
                                    textDecoration: "none",
                                    color: "#0f172a",
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  <span>📄</span> Open Assessment Form (PDF) ↗
                                </a>
                              );
                            }
                            return (
                              <div key={idx} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid #cbd5e1", background: "#fff" }}>
                                <img
                                  src={fileUrl}
                                  alt="Field Evidence"
                                  style={{ width: 140, height: 100, objectFit: "cover", display: "block" }}
                                />
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: "block",
                                    padding: "4px 8px",
                                    fontSize: 10,
                                    color: "#0891b2",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    textAlign: "center",
                                    background: "#f1f5f9",
                                  }}
                                >
                                  View Full Photo ↗
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: ASSISTANCE DISTRIBUTION HISTORY */}
                {detailsTab === "distributions" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        Confirmed Assistance Handover Events
                      </h4>
                      {["verified", "assistance_in_progress", "follow_up_required"].includes(caseDetails.case.status) && (
                        <button
                          onClick={() => handleOpenDistribute()}
                          style={{
                            padding: "6px 12px",
                            background: "#0891b2",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          + Log Distribution Event
                        </button>
                      )}
                    </div>

                    {caseDetails.distributions?.length === 0 ? (
                      <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 10 }}>
                        No physical distributions recorded for this case yet.
                      </div>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                            <th style={{ padding: 10 }}>Reference</th>
                            <th style={{ padding: 10 }}>Item & Qty</th>
                            <th style={{ padding: 10 }}>Date</th>
                            <th style={{ padding: 10 }}>Recipient Attestation</th>
                            <th style={{ padding: 10 }}>Recorded By</th>
                            <th style={{ padding: 10 }}>Status</th>
                            <th style={{ padding: 10, textAlign: "right" }}>Audit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {caseDetails.distributions.map((d) => (
                            <tr key={d._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: 10, fontWeight: 700, color: "#0891b2" }}>
                                {d.distributionReference}
                              </td>
                              <td style={{ padding: 10, fontWeight: 600 }}>
                                {d.quantityDistributed} {d.unit} of {d.itemName}
                              </td>
                              <td style={{ padding: 10, color: "#64748b" }}>
                                {new Date(d.distributionDate).toLocaleDateString()}
                              </td>
                              <td style={{ padding: 10, fontSize: 12 }}>
                                {d.recipientAcknowledgement?.recipientName} ({d.recipientAcknowledgement?.relationshipToHead})
                              </td>
                              <td style={{ padding: 10, color: "#64748b" }}>
                                {d.recordedBy?.fullName || "Staff"}
                              </td>
                              <td style={{ padding: 10 }}>
                                <span
                                  style={{
                                    background: d.confirmationStatus === "confirmed" ? "#ecfdf5" : "#fee2e2",
                                    color: d.confirmationStatus === "confirmed" ? "#059669" : "#dc2626",
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  {d.confirmationStatus.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: 10, textAlign: "right" }}>
                                {d.confirmationStatus === "confirmed" && (
                                  <button
                                    onClick={() => {
                                      setDisputeDistId(d._id);
                                    }}
                                    style={{
                                      padding: "3px 8px",
                                      background: "#fef2f2",
                                      color: "#ef4444",
                                      border: "1px solid #fecaca",
                                      borderRadius: 4,
                                      fontSize: 11,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Flag Dispute
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* TAB 3: TRACEABILITY TO EXISTING RESOURCES */}
                {detailsTab === "traceability" && (
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
                      Multi-Stage Resource Traceability Map
                    </h4>
                    <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
                      Links between assessed beneficiary need → NGO posted requirement → donor supplies → volunteer
                      deliveries.
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      {/* Linked NGO Requirements */}
                      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0891b2", marginBottom: 8 }}>
                          Linked NGO Requirements
                        </div>
                        {caseDetails.case.linkedRequirements?.length === 0 ? (
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>No requirement linked yet.</div>
                        ) : (
                          caseDetails.case.linkedRequirements.map((r) => (
                            <div key={r._id} style={{ background: "#fff", padding: 8, borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
                              <strong>{r.title}</strong> • {r.quantity} {r.unit} ({r.category})
                            </div>
                          ))
                        )}
                      </div>

                      {/* Linked Donations */}
                      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
                          Linked Donor Contributions
                        </div>
                        {caseDetails.case.linkedDonations?.length === 0 ? (
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>No donor donation linked yet.</div>
                        ) : (
                          caseDetails.case.linkedDonations.map((d) => (
                            <div key={d._id} style={{ background: "#fff", padding: 8, borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
                              <strong>{d.donationName}</strong> • {d.quantity} {d.unit}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Linked Deliveries */}
                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0", marginTop: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#d97706", marginBottom: 8 }}>
                        Linked Movement / Delivery Records
                      </div>
                      {caseDetails.case.linkedDeliveries?.length === 0 ? (
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>No delivery record linked yet.</div>
                      ) : (
                        caseDetails.case.linkedDeliveries.map((del) => (
                          <div key={del._id} style={{ background: "#fff", padding: 10, borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
                            <div style={{ fontWeight: 700 }}>
                              Delivery Status: <span style={{ color: "#059669" }}>{del.status.toUpperCase()}</span>
                            </div>
                            <div style={{ color: "#64748b", marginTop: 2 }}>
                              Drop Location: {del.dropAddress} • Delivered At:{" "}
                              {del.deliveredAt ? new Date(del.deliveredAt).toLocaleString() : "In transit"}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: AUDIT TIMELINE & FOLLOW-UP */}
                {detailsTab === "followup" && (
                  <div>
                    {/* Add Follow-Up Form */}
                    <form
                      onSubmit={handleAddFollowUp}
                      style={{
                        background: "#f8fafc",
                        borderRadius: 10,
                        padding: 14,
                        border: "1px solid #e2e8f0",
                        marginBottom: 20,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                        Record Follow-Up Assessment Finding:
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <input
                          type="text"
                          placeholder="Field inspection findings (e.g. household has received food; roof repaired)..."
                          value={followUpFinding}
                          onChange={(e) => setFollowUpFinding(e.target.value)}
                          style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Action taken or scheduled..."
                          value={followUpAction}
                          onChange={(e) => setFollowUpAction(e.target.value)}
                          style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{
                          padding: "6px 14px",
                          background: "#0891b2",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Save Follow-up Note
                      </button>
                    </form>

                    {/* Follow-up Notes list */}
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                      Prior Follow-Up Records
                    </h4>
                    {caseDetails.case.followUpNotes?.length === 0 ? (
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>No follow-up notes yet.</div>
                    ) : (
                      caseDetails.case.followUpNotes.map((n, idx) => (
                        <div key={idx} style={{ background: "#fff", border: "1px solid #e2e8f0", padding: 10, borderRadius: 8, marginBottom: 8, fontSize: 12 }}>
                          <div style={{ fontWeight: 700, color: "#1e293b" }}>{n.findings}</div>
                          {n.actionTaken && <div style={{ color: "#059669", marginTop: 2 }}>Action: {n.actionTaken}</div>}
                          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>
                            {new Date(n.noteDate).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}

                    {/* Status Audit Trail */}
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginTop: 20, marginBottom: 8 }}>
                      Lifecycle Audit History
                    </h4>
                    <div style={{ borderLeft: "2px solid #cbd5e1", paddingLeft: 14, marginLeft: 6 }}>
                      {caseDetails.case.statusHistory?.map((h, idx) => (
                        <div key={idx} style={{ marginBottom: 14, position: "relative" }}>
                          <div
                            style={{
                              position: "absolute",
                              left: -20,
                              top: 4,
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: "#0891b2",
                            }}
                          />
                          <div style={{ fontWeight: 700, fontSize: 12, color: "#0f172a", textTransform: "uppercase" }}>
                            {h.status.replace(/_/g, " ")}
                          </div>
                          <div style={{ fontSize: 12, color: "#475569" }}>{h.notes}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(h.changedAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 3: RECORD ASSISTANCE DISTRIBUTION ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {showDistributeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              width: "100%",
              maxWidth: 580,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Record Physical Assistance Distribution
                </h3>
                <p style={{ color: "#64748b", fontSize: 12, margin: "2px 0 0 0" }}>
                  Assistance is recorded only when physically handed over to the household.
                </p>
              </div>
              <button
                onClick={() => setShowDistributeModal(false)}
                style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDistribution}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={distributeForm.itemName}
                    onChange={(e) => setDistributeForm({ ...distributeForm, itemName: e.target.value })}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={distributeForm.category}
                    onChange={(e) => setDistributeForm({ ...distributeForm, category: e.target.value })}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  >
                    <option value="food">Food</option>
                    <option value="medical">Medical</option>
                    <option value="clothing">Clothing</option>
                    <option value="shelter">Shelter</option>
                    <option value="education">Education</option>
                    <option value="hygiene">Hygiene</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Qty Distributed *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={distributeForm.quantityDistributed}
                    onChange={(e) => setDistributeForm({ ...distributeForm, quantityDistributed: e.target.value })}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Measurement Unit
                  </label>
                  <select
                    value={distributeForm.unit}
                    onChange={(e) => setDistributeForm({ ...distributeForm, unit: e.target.value })}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  >
                    <option value="Items">Items</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Kg">Kg</option>
                    <option value="Liters">Liters</option>
                    <option value="Packets">Packets</option>
                    <option value="Kits">Kits</option>
                    <option value="Sets">Sets</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Distribution Date
                  </label>
                  <input
                    type="date"
                    value={distributeForm.distributionDate}
                    onChange={(e) => setDistributeForm({ ...distributeForm, distributionDate: e.target.value })}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Recipient Acknowledgement */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 8,
                  padding: 12,
                  border: "1px solid #e2e8f0",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Recipient Handover Acknowledgement:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Recipient Name (e.g. Beneficiary)"
                    value={distributeForm.recipientName}
                    onChange={(e) => setDistributeForm({ ...distributeForm, recipientName: e.target.value })}
                    style={{ padding: 6, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Relationship to Head (e.g. Self, Spouse)"
                    value={distributeForm.relationshipToHead}
                    onChange={(e) => setDistributeForm({ ...distributeForm, relationshipToHead: e.target.value })}
                    style={{ padding: 6, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Worker Handover Attestation Notes
                </label>
                <input
                  type="text"
                  placeholder="Notes on condition, distribution venue, or follow-up check..."
                  value={distributeForm.notes}
                  onChange={(e) => setDistributeForm({ ...distributeForm, notes: e.target.value })}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowDistributeModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
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
                  style={{
                    padding: "8px 18px",
                    borderRadius: 6,
                    border: "none",
                    background: "#059669",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Confirm Distribution Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 4: CLOSE BENEFICIARY CASE ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {showCloseModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              width: "100%",
              maxWidth: 500,
              padding: 24,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
              Close Beneficiary Case
            </h3>
            <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 14px 0" }}>
              Closing a case archives its active assistance requirements.
            </p>

            <form onSubmit={handleCloseCase}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Closure Reason *
                </label>
                <input
                  type="text"
                  placeholder="e.g. All relief kits delivered; family rehabilitated"
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  required
                />
              </div>

              {!caseDetails?.fulfillment?.allItemsFulfilled && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      color: "#92400e",
                      padding: 10,
                      borderRadius: 6,
                      fontSize: 12,
                      marginBottom: 8,
                    }}
                  >
                    ⚠️ This case still has outstanding unmet needs. A mandatory rationale is required to close.
                  </div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Unmet Needs Rationale *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Explain why remaining needs are no longer required (e.g. Government aid camp provided bedding)..."
                    value={unmetRationale}
                    onChange={(e) => setUnmetRationale(e.target.value)}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                    required
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 6,
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
                  style={{
                    padding: "8px 18px",
                    borderRadius: 6,
                    border: "none",
                    background: "#0f172a",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Confirm Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 5: DISPUTE DISTRIBUTION RECORD ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {disputeDistId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              width: "100%",
              maxWidth: 480,
              padding: 22,
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#dc2626", margin: "0 0 8px 0" }}>
              Flag Assistance Distribution Dispute
            </h3>
            <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 12px 0" }}>
              Disputing will flag this case for follow-up investigation without rewriting the audit history.
            </p>

            <form onSubmit={handleDisputeSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Dispute Explanation *
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain discrepancy (e.g. beneficiary claims only 1 blanket received instead of 2; goods damaged)..."
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setDisputeDistId(null)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
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
                  style={{
                    padding: "6px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: "#dc2626",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Flag Disputed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
