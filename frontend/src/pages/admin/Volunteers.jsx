import { useEffect, useState } from "react";
import axios from "../../api/axios";
import { toast } from "react-toastify";
import "../../styles/admin/organization.css";

import SearchBar from "../../components/admin/common/SearchBar";
import RejectDialog from "../../components/admin/common/RejectDialog";

import VolunteerTable from "../../components/admin/volunteer/VolunteerTable";
import VolunteerDetails from "../../components/admin/volunteer/VolunteerDetails";

function Volunteers() {
  const token = localStorage.getItem("token");

  const [statusFilter, setStatusFilter] = useState("pending");

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  });

  const [volunteers, setVolunteers] = useState([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  const [search, setSearch] = useState("");

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [volunteerToReject, setVolunteerToReject] = useState(null);

  useEffect(() => {
    fetchVolunteers();
  }, [statusFilter]);

  useEffect(() => {
    let filtered = [...volunteers];

    if (search.trim()) {
      filtered = filtered.filter((volunteer) => {
        const name = volunteer.userId?.fullName?.toLowerCase() || "";
        const email = volunteer.userId?.email?.toLowerCase() || "";

        return (
          name.includes(search.toLowerCase()) ||
          email.includes(search.toLowerCase())
        );
      });
    }

    setFilteredVolunteers(filtered);
  }, [volunteers, search]);

  const fetchVolunteers = async () => {
    try {
      const res = await axios.get(`/admin/volunteers?status=${statusFilter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVolunteers(res.data.volunteers);
      setFilteredVolunteers(res.data.volunteers);
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load volunteers.");
    }
  };

  const approveVolunteer = async (id) => {
    try {
      await axios.put(
        `/admin/volunteer/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Volunteer approved successfully");

      setSelectedVolunteer(null);
      fetchVolunteers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve volunteer");
    }
  };

  const openRejectDialog = (volunteer) => {
    setVolunteerToReject(volunteer);
    setShowRejectDialog(true);
  };

  const rejectVolunteer = async (reason) => {
    try {
      await axios.put(
        `/admin/volunteer/${volunteerToReject._id}/reject`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Volunteer rejected");

      setShowRejectDialog(false);
      setVolunteerToReject(null);
      setSelectedVolunteer(null);

      fetchVolunteers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject volunteer");
    }
  };

  return (
    <>
      {/* ================= HEADER ================= */}

      <div className="page-header">
        <div>
          <h2>Volunteer Management</h2>

          <p className="page-subtitle">
            Review volunteer applications, verify identities, approve trusted
            delivery volunteers, and manage community participation.
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
            <p>Verified Volunteers</p>
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
            <p>Application Rejected</p>
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
          <div className="stat-icon total-icon">👥</div>

          <div className="stat-info">
            <h4>Total</h4>
            <p>Registered Volunteers</p>
          </div>

          <h2>{stats.total}</h2>
        </div>
      </div>

      {/* ================= SEARCH ================= */}

      <div className="table-toolbar">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search volunteers..."
        />
      </div>

      {/* ================= TABLE ================= */}

      <VolunteerTable
        volunteers={filteredVolunteers}
        onView={setSelectedVolunteer}
      />

      {/* ================= DETAILS ================= */}

      {selectedVolunteer && (
        <VolunteerDetails
          volunteer={selectedVolunteer}
          onClose={() => setSelectedVolunteer(null)}
          onApprove={approveVolunteer}
          onReject={openRejectDialog}
        />
      )}

      {/* ================= REJECT DIALOG ================= */}

      <RejectDialog
        open={showRejectDialog}
        title="Reject Volunteer"
        onClose={() => {
          setShowRejectDialog(false);
          setVolunteerToReject(null);
        }}
        onConfirm={rejectVolunteer}
      />
    </>
  );
}

export default Volunteers;
