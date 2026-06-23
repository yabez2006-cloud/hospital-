import { useEffect, useState } from "react";
import { FaCalendarCheck, FaHeart, FaHospital, FaUserInjured, FaUserMd, FaHeartbeat } from "react-icons/fa";
import { fetchDashboard } from "../api";
import { getAuthUser } from "../auth";

export default function Dashboard() {
  const user = getAuthUser();
  const role = user?.role || "admin";
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    crowdStatus: "Low",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await fetchDashboard();
        setStats(data);
      } catch (err) {
        setError(err.message);
      }
    };

    loadDashboard();
  }, []);

  const crowdClass = stats.crowdStatus.toLowerCase();

  const cardSets = {
    admin: [
      { title: "Total Patients", icon: <FaUserInjured />, value: stats.patients },
      { title: "Total Doctors", icon: <FaUserMd />, value: stats.doctors },
      { title: "Total Appointments", icon: <FaCalendarCheck />, value: stats.appointments },
      { title: "Hospital Crowd Meter", icon: <FaHospital />, value: stats.crowdStatus, accent: true },
    ],
    doctor: [
      { title: "My Appointments", icon: <FaCalendarCheck />, value: stats.appointments },
      { title: "Availability Status", icon: <FaHeartbeat />, value: stats.availabilityStatus || "Available" },
      { title: "Patients Assigned", icon: <FaUserInjured />, value: stats.patientsAssigned || 0 },
    ],
    patient: [
      { title: "Available Doctors", icon: <FaUserMd />, value: stats.doctors },
      { title: "My Appointments", icon: <FaCalendarCheck />, value: stats.appointments },
      { title: "Favorite Doctor", icon: <FaHeart />, value: stats.favoriteDoctor?.name || "Not selected" },
      { title: "Crowd Meter", icon: <FaHospital />, value: stats.crowdStatus, accent: true },
    ],
  };

  const cards = cardSets[role] || cardSets.admin;

  return (
    <>
      <section className="hero-panel">
        <h2>{role === "doctor" ? "Doctor Dashboard" : role === "patient" ? "Patient Dashboard" : "Hospital Dashboard"}</h2>
        <p>
          {role === "doctor"
            ? "Monitor your availability, assigned patients, and appointments."
            : role === "patient"
            ? "Track doctors, favorite selection, and appointment activity."
            : "Monitor patient flow, doctor capacity, and appointment pressure in one place."}
        </p>
        {error && <div className="error">{error}</div>}
      </section>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <div
            className={`card metric-card${card.accent ? ` crowd-card crowd-${crowdClass}` : ""}`}
            key={card.title}
          >
            <h3>
              {card.icon} {card.title}
            </h3>
            <p>{card.value}</p>
          </div>
        ))}
      </div>
    </>
  );
}
