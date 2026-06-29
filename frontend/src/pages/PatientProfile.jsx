import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuthUser } from "../auth";
import { fetchMyPatientProfile, fetchMyDoctors } from "../api";

export default function PatientProfile() {
  const user = getAuthUser();
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    if (!user || user.role !== "patient") return;
    fetchMyPatientProfile().then(setPatient).catch(() => {});
    fetchMyDoctors().then(setDoctors).catch(() => {});
  }, [user]);

  if (!user || user.role !== "patient") return <Navigate to="/dashboard" replace />;

  return (
    <section>
      <h2>My Profile</h2>
      <p style={{ marginTop: 8, color: "#333", fontSize: "1rem" }}>
        Welcome, <strong>{patient?.name || user.username}</strong>
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card">
            <h3 style={{ margin: "0 0 16px", color: "var(--primary)" }}>Patient Information</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><strong>Username:</strong> <span style={{ marginLeft: 8, color: "#555" }}>{user.username}</span></div>
              <div><strong>Name:</strong> <span style={{ marginLeft: 8, color: "#555" }}>{patient?.name || user.username}</span></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ margin: "0 0 16px", color: "var(--primary)" }}>Doctors You've Visited</h3>
            {doctors.length === 0 ? (
              <p style={{ color: "#666", fontSize: "0.95rem" }}>No visits recorded yet.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0 }}>
                {doctors.map((ap) => (
                  <li key={ap._id} style={{ padding: "12px 0", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ color: "#1e293b" }}>{ap.doctor?.name || "Doctor"}</strong>
                      {ap.doctor?.specialization && (
                        <span style={{ fontSize: "0.85rem", color: "#64748b", marginLeft: 8, padding: "2px 8px", background: "#f1f5f9", borderRadius: 6 }}>
                          {ap.doctor.specialization}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      {new Date(ap.date).toLocaleDateString()} at {ap.time || "N/A"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
