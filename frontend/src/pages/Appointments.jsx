import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchPatients, fetchDoctors, fetchAppointments, createAppointment, deleteAppointment } from "../api";
import AppointmentForm from "../components/AppointmentForm";
import { getAuthUser } from "../auth";

export default function Appointments() {
  const user = getAuthUser();
  const role = user?.role || "admin";
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      if (role === "admin") {
        const [patientData, doctorData, appointmentData] = await Promise.all([
          fetchPatients(),
          fetchDoctors(),
          fetchAppointments(),
        ]);
        setPatients(patientData);
        setDoctors(doctorData);
        setAppointments(appointmentData);
        return;
      }

      setAppointments(await fetchAppointments());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

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

  if (!["admin", "doctor", "patient"].includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section>
      {role === "admin" ? <AppointmentForm patients={patients} doctors={doctors} onSubmit={handleCreate} /> : null}
      {error && <div className="error">{error}</div>}
      <h2>{role === "admin" ? "Appointment Booking" : "My Appointments"}</h2>
      <ul>
        {appointments.map((appointment) => (
          <li key={appointment._id}>
            <span>
              {appointment.patient?.name} with {appointment.doctor?.name} on {new Date(appointment.date).toLocaleString()}
            </span>
            {role === "admin" ? <button onClick={() => handleDelete(appointment._id)}>Delete</button> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
