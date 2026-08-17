import { Routes, Route } from "react-router-dom";
import OrgSidebar from "../../components/organization/OrgSidebar";
import OrgNavbar from "../../components/organization/OrgNavbar";
import OrgHome from "./OrgHome";
import CreateRequirement from "./CreateRequirement";
import MyRequirements from "./MyRequirements";
import IncomingDonations from "./IncomingDonations";
import OrganizationProfile from "./OrganizationProfile";
import "./organization.css";

export default function OrganizationDashboard() {
  return (
    <div className="org-shell">
      <OrgSidebar />
      <div className="org-main">
        <Routes>
          <Route
            index
            element={
              <>
                <OrgNavbar pageTitle="Organization Dashboard" />
                <div className="org-content">
                  <OrgHome />
                </div>
              </>
            }
          />
          <Route
            path="dashboard"
            element={
              <>
                <OrgNavbar pageTitle="Organization Dashboard" />
                <div className="org-content">
                  <OrgHome />
                </div>
              </>
            }
          />
          <Route
            path="create-requirement"
            element={
              <>
                <OrgNavbar pageTitle="Post Requirement" />
                <div className="org-content">
                  <CreateRequirement />
                </div>
              </>
            }
          />
          <Route
            path="my-requirements"
            element={
              <>
                <OrgNavbar pageTitle="My Requirements" />
                <div className="org-content">
                  <MyRequirements />
                </div>
              </>
            }
          />
          <Route
            path="incoming-donations"
            element={
              <>
                <OrgNavbar pageTitle="Incoming Donations" />
                <div className="org-content">
                  <IncomingDonations />
                </div>
              </>
            }
          />
          <Route
            path="profile"
            element={
              <>
                <OrgNavbar pageTitle="Organization Profile" />
                <div className="org-content">
                  <OrganizationProfile />
                </div>
              </>
            }
          />
          <Route
            path="*"
            element={
              <>
                <OrgNavbar pageTitle="Organization Dashboard" />
                <div className="org-content">
                  <OrgHome />
                </div>
              </>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
