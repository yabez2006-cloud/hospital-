import { useEffect, useState } from "react";
import { fetchPatients, createPatient, deletePatient } from "../api";
import PatientForm from "../components/PatientForm";

export default function Patients() {
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
    loadPatients();
  }, []);

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

  return (
    <section>
      <PatientForm onSubmit={handleCreate} />
      {error && <div className="error">{error}</div>}
      <h2>Patients</h2>
      <ul>
        {patients.map((patient) => (
          <li key={patient._id}>
            {patient.name} — {patient.age} — {patient.gender} — {patient.phone}
            <button onClick={() => handleDelete(patient._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
