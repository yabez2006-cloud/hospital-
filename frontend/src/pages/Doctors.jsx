import { useEffect, useState } from "react";
import { fetchDoctors, createDoctor, deleteDoctor } from "../api";
import DoctorForm from "../components/DoctorForm";

export default function Doctors() {
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

  return (
    <section>
      <DoctorForm onSubmit={handleCreate} />
      {error && <div className="error">{error}</div>}
      <h2>Doctors</h2>
      <ul>
        {doctors.map((doctor) => (
          <li key={doctor._id}>
            {doctor.name} — {doctor.specialization} — {doctor.availability || "Available"}
            <button onClick={() => handleDelete(doctor._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
