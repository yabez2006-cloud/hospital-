import { useEffect, useState } from "react";
import { fetchPatients, fetchDoctors, fetchAppointments, createAppointment, deleteAppointment } from "../api";
import AppointmentForm from "../components/AppointmentForm";

export default function Appointments() {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [patientData, doctorData, appointmentData] = await Promise.all([
        fetchPatients(),
        fetchDoctors(),
        fetchAppointments(),
      ]);
      setPatients(patientData);
      setDoctors(doctorData);
      setAppointments(appointmentData);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (data) => {
    try {
      await createAppointment(data);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    await deleteAppointment(id);
    loadData();
  };

  return (
    <section>
      <AppointmentForm patients={patients} doctors={doctors} onSubmit={handleCreate} />
      {error && <div className="error">{error}</div>}
      <h2>Appointments</h2>
      <ul>
        {appointments.map((appointment) => (
          <li key={appointment._id}>
            {appointment.patient?.name} with {appointment.doctor?.name} on {new Date(appointment.date).toLocaleString()}
            <button onClick={() => handleDelete(appointment._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
