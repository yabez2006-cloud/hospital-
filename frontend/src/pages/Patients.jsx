import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchPatients, deletePatient } from "../api";
import { getAuthUser } from "../auth";

export default function Patients() {
  const user = getAuthUser();
  const role = user?.role || "admin";
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");

  const loadPatients = async () => {
    try {
      setPatients(await fetchPatients());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (role !== "admin") {
      return;
    }

    loadPatients();
  }, [role]);

  const handleCreate = async (data) => {
    try {
      await createPatient(data);
      loadPatients();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    await deletePatient(id);
    loadPatients();
  };

  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section>
      {/* Admin patient creation removed — patients register themselves */}
      {error && <div className="error">{error}</div>}
      <h2>Patient Management</h2>
      <ul>
        {patients.map((patient) => (
          <li key={patient._id}>
            <span>
              {patient.name} — {patient.age} — {patient.gender} — {patient.phone}
            </span>
            <button onClick={() => handleDelete(patient._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
