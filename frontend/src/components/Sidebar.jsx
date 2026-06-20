import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUserInjured,
  FaUserMd,
  FaCalendarCheck,
  FaCommentDots,
  FaSignOutAlt,
  FaHospital,
} from "react-icons/fa";

function SidebarLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}

export default function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <FaHospital />
        </div>
        <div>
          <h2>Hospital Management</h2>
          <p>Admin control center</p>
        </div>
      </div>

      <nav>
        <SidebarLink to="/home" icon={<FaHome />}>
          Dashboard
        </SidebarLink>
        <SidebarLink to="/patients" icon={<FaUserInjured />}>
          Patient Management
        </SidebarLink>
        <SidebarLink to="/doctors" icon={<FaUserMd />}>
          Doctor Management
        </SidebarLink>
        <SidebarLink to="/appointments" icon={<FaCalendarCheck />}>
          Appointment Booking
        </SidebarLink>
        <SidebarLink to="/feedback" icon={<FaCommentDots />}>
          Feedback
        </SidebarLink>

        <button type="button" className="sidebar-logout" onClick={onLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}