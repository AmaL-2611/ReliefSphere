import { Routes, Route } from "react-router-dom";
import DonorSidebar from "../../components/donor/DonorSidebar";
import DonorNavbar from "../../components/donor/DonorNavbar";
import DonorHome from "./DonorHome";
import CreateDonation from "./CreateDonation";
import MyDonations from "./MyDonations";
import TrackDonation from "./TrackDonation";
import DonorProfile from "./DonorProfile";
import BrowseRequirements from "./BrowseRequirements";
import DonorDonateRequirement from "./DonorDonateRequirement";
import "./donor.css";

export default function DonorDashboard() {
  return (
    <div className="donor-shell">
      <DonorSidebar />
      <div className="donor-main">
        <Routes>
          {/* Matches /donor-dashboard and /donor-dashboard/ */}
          <Route
            index
            element={
              <>
                <DonorNavbar pageTitle="Dashboard" />
                <div className="donor-content">
                  <DonorHome />
                </div>
              </>
            }
          />
          <Route
            path="create-donation"
            element={
              <>
                <DonorNavbar pageTitle="Create Donation" />
                <div className="donor-content">
                  <CreateDonation />
                </div>
              </>
            }
          />
          <Route
            path="my-donations"
            element={
              <>
                <DonorNavbar pageTitle="My Donations" />
                <div className="donor-content">
                  <MyDonations />
                </div>
              </>
            }
          />
          <Route
            path="track-donation"
            element={
              <>
                <DonorNavbar pageTitle="Track Donation" />
                <div className="donor-content">
                  <TrackDonation />
                </div>
              </>
            }
          />
          <Route
            path="profile"
            element={
              <>
                <DonorNavbar pageTitle="My Profile" />
                <div className="donor-content">
                  <DonorProfile />
                </div>
              </>
            }
          />
          <Route
            path="browse-requirements"
            element={
              <>
                <DonorNavbar pageTitle="Browse Requirements" />
                <div className="donor-content">
                  <BrowseRequirements />
                </div>
              </>
            }
          />
          <Route
            path="donate/:requirementId"
            element={
              <>
                <DonorNavbar pageTitle="Donate To Requirement" />
                <div className="donor-content">
                  <DonorDonateRequirement />
                </div>
              </>
            }
          />
          {/* Catch-all redirects to home */}
          <Route
            path="*"
            element={
              <>
                <DonorNavbar pageTitle="Dashboard" />
                <div className="donor-content">
                  <DonorHome />
                </div>
              </>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
