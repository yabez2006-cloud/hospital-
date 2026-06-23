import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchDoctors, createDoctor, deleteDoctor } from "../api";
import DoctorForm from "../components/DoctorForm";
import { getAuthUser } from "../auth";

export default function Doctors() {
  const user = getAuthUser();
  const role = user?.role || "admin";
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");

  const loadDoctors = async () => {
    try {
      setDoctors(await fetchDoctors());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleCreate = async (data) => {
    try {
      await createDoctor(data);
      loadDoctors();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    await deleteDoctor(id);
    loadDoctors();
  };

  if (role === "doctor") {
    return <Navigate to="/doctor-profile" replace />;
  }

  return (
    <section>
      {role === "admin" ? <DoctorForm onSubmit={handleCreate} /> : null}
      {error && <div className="error">{error}</div>}
      <h2>{role === "admin" ? "Doctor Management" : "Available Doctors"}</h2>
      <ul>
        {doctors.map((doctor) => (
          <li key={doctor._id}>
            <span>
              {doctor.name} — {doctor.specialization} — {doctor.availability || "Available"}
            </span>
            {role === "admin" ? <button onClick={() => handleDelete(doctor._id)}>Delete</button> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
