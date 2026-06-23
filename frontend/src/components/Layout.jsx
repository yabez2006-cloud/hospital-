import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { clearAuthSession, getAuthUser } from "../auth";

export default function Layout() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const role = user?.role || "admin";

  const handleLogout = () => {
    clearAuthSession();
    navigate("/");
  };

  return (
    <div className="app-shell">
      <Sidebar role={role} onLogout={handleLogout} />

      <div className="main-panel">
        <header className="topbar">
          <h1>{role === "doctor" ? "Doctor Dashboard" : role === "patient" ? "Patient Dashboard" : "Admin Dashboard"}</h1>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
