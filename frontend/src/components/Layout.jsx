import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="app-shell">
      <Sidebar onLogout={handleLogout} />

      <div className="main-panel">
        <header className="topbar">
          <h1>Dashboard</h1>
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
