import { Routes, Route } from "react-router-dom";
import VolSidebar from "../../components/volunteer/VolSidebar";
import VolNavbar from "../../components/volunteer/VolNavbar";
import VolHome from "./VolHome";
import AssignedDeliveries from "./AssignedDeliveries";
import CompletedDeliveries from "./CompletedDeliveries";
import VolunteerProfile from "./VolunteerProfile";
import "./volunteer.css";

export default function VolunteerDashboard() {
  return (
    <div className="vol-shell">
      <VolSidebar />
      <div className="vol-main">
        <Routes>
          <Route
            index
            element={
              <>
                <VolNavbar pageTitle="Volunteer Dashboard" />
                <div className="vol-content">
                  <VolHome />
                </div>
              </>
            }
          />
          <Route
            path="dashboard"
            element={
              <>
                <VolNavbar pageTitle="Volunteer Dashboard" />
                <div className="vol-content">
                  <VolHome />
                </div>
              </>
            }
          />
          <Route
            path="assigned-deliveries"
            element={
              <>
                <VolNavbar pageTitle="Assigned Deliveries" />
                <div className="vol-content">
                  <AssignedDeliveries />
                </div>
              </>
            }
          />
          <Route
            path="completed-deliveries"
            element={
              <>
                <VolNavbar pageTitle="Completed History" />
                <div className="vol-content">
                  <CompletedDeliveries />
                </div>
              </>
            }
          />
          <Route
            path="profile"
            element={
              <>
                <VolNavbar pageTitle="Volunteer Profile" />
                <div className="vol-content">
                  <VolunteerProfile />
                </div>
              </>
            }
          />
          <Route
            path="*"
            element={
              <>
                <VolNavbar pageTitle="Volunteer Dashboard" />
                <div className="vol-content">
                  <VolHome />
                </div>
              </>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
