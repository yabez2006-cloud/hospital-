import { useEffect, useState } from "react";
import { FaCalendarCheck, FaUserInjured, FaUserMd } from "react-icons/fa";
import { fetchDashboard } from "../api";

export default function Dashboard() {
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

  return (
    <>
      <section className="hero-panel">
        <h2>Hospital Dashboard</h2>
        <p>Monitor patient flow, doctor capacity, and appointment pressure in one place.</p>
        {error && <div className="error">{error}</div>}
      </section>

      <div className="dashboard-grid">
        <div className="card metric-card">
          <h3>
            <FaUserInjured /> Total Patients
          </h3>
          <p>{stats.patients}</p>
        </div>

        <div className="card metric-card">
          <h3>
            <FaUserMd /> Total Doctors
          </h3>
          <p>{stats.doctors}</p>
        </div>

        <div className="card metric-card">
          <h3>
            <FaCalendarCheck /> Total Appointments
          </h3>
          <p>{stats.appointments}</p>
        </div>

        <div className={`card metric-card crowd-card crowd-${crowdClass}`}>
          <h3>Crowd Meter</h3>
          <p>{stats.crowdStatus}</p>
        </div>
      </div>
    </>
  );
}
