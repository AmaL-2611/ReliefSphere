import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DonorDashboard from "./pages/donor/DonorDashboard";
import OrganizationDashboard from "./pages/organization/OrganizationDashboard";
import VolunteerDashboard from "./pages/volunteer/VolunteerDashboard";
import AdminRoute from "./routes/AdminRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import Organizations from "./pages/admin/Organizations";
import Volunteers from "./pages/admin/Volunteers";
import Donors from "./pages/admin/donors";
import Donations from "./pages/admin/Donations";
import Deliveries from "./pages/admin/Deliveries";
import Campaigns from "./pages/admin/Campaigns";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* Donor Dashboard — wildcard allows nested sub-routes */}
        <Route
          path="/donor-dashboard/*"
          element={
            <ProtectedRoute allowedRole="donor">
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/*"
          element={
            <ProtectedRoute allowedRole="donor">
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organization-dashboard/*"
          element={
            <ProtectedRoute allowedRole="recipient_org">
              <OrganizationDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/*"
          element={
            <ProtectedRoute allowedRole="recipient_org">
              <OrganizationDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/volunteer-dashboard/*"
          element={
            <ProtectedRoute allowedRole="volunteer">
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer/*"
          element={
            <ProtectedRoute allowedRole="volunteer">
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="volunteers" element={<Volunteers />} />
          <Route path="donors" element={<Donors />} />
          <Route path="donations" element={<Donations />} />
          <Route path="deliveries" element={<Deliveries />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </BrowserRouter>
  );
}

export default App;
