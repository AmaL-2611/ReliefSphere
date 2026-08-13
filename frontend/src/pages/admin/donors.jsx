import { useEffect, useState } from "react";
import axios from "../../api/axios";
import { toast } from "react-toastify";

import "../../styles/admin/donor.css";

import SearchBar from "../../components/admin/common/SearchBar";
import DonorTable from "../../components/admin/donor/DonorTable";
import DonorDetails from "../../components/admin/donor/DonorDetails";

function Donors() {
  const token = localStorage.getItem("token");

  const [typeFilter, setTypeFilter] = useState("all");

  const [stats, setStats] = useState({
    total: 0,
    individual: 0,
    small_business: 0,
    educational_institution: 0,
  });

  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDonors();
  }, [typeFilter]);

  useEffect(() => {
    let filtered = [...donors];

    if (search.trim()) {
      filtered = filtered.filter((donor) => {
        const name = donor.userId?.fullName?.toLowerCase() || "";
        const email = donor.userId?.email?.toLowerCase() || "";

        return (
          name.includes(search.toLowerCase()) ||
          email.includes(search.toLowerCase())
        );
      });
    }

    setFilteredDonors(filtered);
  }, [search, donors]);

  const fetchDonors = async () => {
    try {
      const res = await axios.get(`/admin/donors?type=${typeFilter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDonors(res.data.donors);
      setFilteredDonors(res.data.donors);
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load donors.");
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Registered Donors</h2>

          <p className="page-subtitle">
            View all registered donors and their donation preferences.
          </p>
        </div>
      </div>

      {/* Statistics */}

      <div className="organization-stats">
        <div
          className={`stat-card total ${typeFilter === "all" ? "active" : ""}`}
          onClick={() => setTypeFilter("all")}
        >
          <div className="stat-icon total-icon">👥</div>

          <div className="stat-info">
            <h4>Total</h4>
            <p>Registered Donors</p>
          </div>

          <h2>{stats.total}</h2>
        </div>

        <div
          className={`stat-card approved ${
            typeFilter === "individual" ? "active" : ""
          }`}
          onClick={() => setTypeFilter("individual")}
        >
          <div className="stat-icon approved-icon">🧑</div>

          <div className="stat-info">
            <h4>Individuals</h4>
            <p>Personal Donors</p>
          </div>

          <h2>{stats.individual}</h2>
        </div>

        <div
          className={`stat-card pending ${
            typeFilter === "small_business" ? "active" : ""
          }`}
          onClick={() => setTypeFilter("small_business")}
        >
          <div className="stat-icon pending-icon">🏪</div>

          <div className="stat-info">
            <h4>Businesses</h4>
            <p>Small Businesses</p>
          </div>

          <h2>{stats.small_business}</h2>
        </div>
      </div>

      <div className="table-toolbar">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search donors..."
        />
      </div>

      <DonorTable donors={filteredDonors} onView={setSelectedDonor} />

      {selectedDonor && (
        <DonorDetails
          donor={selectedDonor}
          onClose={() => setSelectedDonor(null)}
        />
      )}
    </>
  );
}

export default Donors;
