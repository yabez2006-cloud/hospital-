import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUserInjured,
  FaUserMd,
  FaCalendarCheck,
  FaCommentDots,
  FaSignOutAlt,
  FaHospital,
  FaHeart,
  FaHeartbeat,
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

export default function Sidebar({ role = "admin", onLogout }) {
  const navigation = {
    admin: [
      { to: "/dashboard", icon: <FaHome />, label: "Dashboard" },
      { to: "/patients", icon: <FaUserInjured />, label: "Patient Management" },
      { to: "/doctors", icon: <FaUserMd />, label: "Doctor Management" },
      { to: "/appointments", icon: <FaCalendarCheck />, label: "Appointment Booking" },
      { to: "/feedback", icon: <FaCommentDots />, label: "View Feedback" },
    ],
    doctor: [
      { to: "/dashboard", icon: <FaHome />, label: "Dashboard" },
      { to: "/doctor-profile", icon: <FaUserMd />, label: "My Profile" },
      { to: "/doctor-availability", icon: <FaHeartbeat />, label: "Availability Status" },
      { to: "/doctor-visited-history", icon: <FaHeartbeat />, label: "Visited History" },
      { to: "/appointments", icon: <FaCalendarCheck />, label: "My Appointments" },
    ],
    patient: [
      { to: "/dashboard", icon: <FaHome />, label: "Dashboard" },
      { to: "/doctors", icon: <FaUserMd />, label: "View Doctors" },
      { to: "/favorite-doctors", icon: <FaHeart />, label: "Favorite Doctors" },
      { to: "/appointments", icon: <FaCalendarCheck />, label: "My Appointments" },
      { to: "/patient-profile", icon: <FaUserInjured />, label: "My Profile" },
      { to: "/feedback", icon: <FaCommentDots />, label: "Give Feedback" },
    ],
  };

  const links = navigation[role] || navigation.admin;

  return (
    <aside className="sidebar">
            <div id="notifications"></div>
      <div className="brand">
        <div className="brand-mark">
          <FaHospital />
        </div>
        <div>
          <h2>Hospital Management</h2>
          <p>{role === "doctor" ? "Doctor workspace" : role === "patient" ? "Patient workspace" : "Admin control center"}</p>
        </div>
      </div>

      <nav>
        {links.map((link) => (
          <SidebarLink key={link.label} to={link.to} icon={link.icon}>
            {link.label}
          </SidebarLink>
        ))}

        <button type="button" className="sidebar-logout" onClick={onLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}