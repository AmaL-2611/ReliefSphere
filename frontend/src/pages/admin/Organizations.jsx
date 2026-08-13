import { useEffect, useState } from "react";
import axios from "../../api/axios";
import { toast } from "react-toastify";
import "../../styles/admin/organization.css";
import SearchBar from "../../components/admin/common/SearchBar";
import RejectDialog from "../../components/admin/common/RejectDialog";
import OrganizationTable from "../../components/admin/organizations/OrganizationTable";
import OrganizationDetails from "../../components/admin/organizations/OrganizationDetails";

function Organizations() {
  const token = localStorage.getItem("token");

  const [statusFilter, setStatusFilter] = useState("pending");

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  });

  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);

  const [search, setSearch] = useState("");

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [organizationToReject, setOrganizationToReject] = useState(null);

  useEffect(() => {
    fetchOrganizations();
  }, [statusFilter]);

  useEffect(() => {
    let filtered = [...organizations];

    if (search.trim()) {
      filtered = filtered.filter((org) => {
        const name = org.orgName?.toLowerCase() || "";
        const email = org.userId?.email?.toLowerCase() || "";

        return (
          name.includes(search.toLowerCase()) ||
          email.includes(search.toLowerCase())
        );
      });
    }

    setFilteredOrganizations(filtered);
  }, [organizations, search]);

  const fetchOrganizations = async () => {
    try {
      const res = await axios.get(
        `/admin/organizations?status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setOrganizations(res.data.organizations);
      setFilteredOrganizations(res.data.organizations);
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load organizations.");
    }
  };

  const approveOrganization = async (id) => {
    try {
      await axios.put(
        `/admin/organizations/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Organization approved successfully.");

      setSelectedOrganization(null);

      fetchOrganizations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve organization.");
    }
  };

  const openRejectDialog = (organization) => {
    setOrganizationToReject(organization);
    setShowRejectDialog(true);
  };

  const rejectOrganization = async (reason) => {
    try {
      await axios.put(
        `/admin/organizations/${organizationToReject._id}/reject`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Organization rejected.");

      setShowRejectDialog(false);
      setOrganizationToReject(null);
      setSelectedOrganization(null);

      fetchOrganizations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject organization.");
    }
  };

  return (
    <>
      {/* ================= HEADER ================= */}

      <div className="page-header">
        <div>
          <h2>Organization Verification</h2>

          <p className="page-subtitle">
            Review submitted organizations, verify legal documents, approve
            trusted partners, and maintain platform integrity.
          </p>
        </div>
      </div>

      {/* ================= STATISTICS ================= */}

      <div className="organization-stats">
        {/* Pending */}

        <div
          className={`stat-card pending ${
            statusFilter === "pending" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("pending")}
        >
          <div className="stat-icon pending-icon">⏳</div>

          <div className="stat-info">
            <h4>Pending</h4>
            <p>Waiting Review</p>
          </div>

          <h2>{stats.pending}</h2>
        </div>

        {/* Approved */}

        <div
          className={`stat-card approved ${
            statusFilter === "verified" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("verified")}
        >
          <div className="stat-icon approved-icon">✅</div>

          <div className="stat-info">
            <h4>Approved</h4>
            <p>Verified Organizations</p>
          </div>

          <h2>{stats.verified}</h2>
        </div>

        {/* Rejected */}

        <div
          className={`stat-card rejected ${
            statusFilter === "rejected" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("rejected")}
        >
          <div className="stat-icon rejected-icon">❌</div>

          <div className="stat-info">
            <h4>Rejected</h4>
            <p>Verification Failed</p>
          </div>

          <h2>{stats.rejected}</h2>
        </div>

        {/* Total */}

        <div
          className={`stat-card total ${
            statusFilter === "all" ? "active" : ""
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <div className="stat-icon total-icon">🏢</div>

          <div className="stat-info">
            <h4>Total</h4>
            <p>Registered Organizations</p>
          </div>

          <h2>{stats.total}</h2>
        </div>
      </div>

      {/* ================= SEARCH ================= */}

      <div className="table-toolbar">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organizations..."
        />
      </div>

      {/* ================= TABLE ================= */}

      <OrganizationTable
        organizations={filteredOrganizations}
        onView={setSelectedOrganization}
      />

      {/* ================= DETAILS ================= */}

      {selectedOrganization && (
        <OrganizationDetails
          organization={selectedOrganization}
          onClose={() => setSelectedOrganization(null)}
          onApprove={approveOrganization}
          onReject={openRejectDialog}
        />
      )}

      {/* ================= REJECT DIALOG ================= */}

      <RejectDialog
        open={showRejectDialog}
        title="Reject Organization"
        onClose={() => {
          setShowRejectDialog(false);
          setOrganizationToReject(null);
        }}
        onConfirm={rejectOrganization}
      />
    </>
  );
}

export default Organizations;
