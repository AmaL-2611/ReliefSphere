import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin/sidebar";
import Topbar from "../components/admin/Topbar";

function AdminLayout() {
  return (
    <div className="d-flex">
      <Sidebar />

      <div
        className="flex-grow-1"
        style={{
          marginLeft: "260px",
          background: "#f1f5f9",
          minHeight: "100vh",
        }}
      >
        <Topbar />

        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
