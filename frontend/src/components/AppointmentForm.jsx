import { useState } from "react";

export default function AppointmentForm({ patients, doctors, onSubmit }) {
  const [form, setForm] = useState({ patient: "", doctor: "", date: "", notes: "" });
  const availableDoctors = doctors.filter((doctor) => doctor.availability !== "Unavailable");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, date: new Date(form.date).toISOString() });
    setForm({ patient: "", doctor: "", date: "", notes: "" });
  };

  return (
    <form onSubmit={submit}>
      <h2>Schedule Appointment</h2>
      <label>Patient</label>
      <select name="patient" value={form.patient} onChange={handleChange} required>
        <option value="">Select patient</option>
        {patients.map((patient) => (
          <option key={patient._id} value={patient._id}>
            {patient.name}
          </option>
        ))}
      </select>
      <label>Doctor</label>
      <select name="doctor" value={form.doctor} onChange={handleChange} required>
        <option value="">Select doctor</option>
        {availableDoctors.map((doctor) => (
          <option key={doctor._id} value={doctor._id}>
            {doctor.name}
          </option>
        ))}
      </select>
      <label>Date</label>
      <input name="date" type="datetime-local" value={form.date} onChange={handleChange} required />
      <label>Notes</label>
      <textarea name="notes" value={form.notes} onChange={handleChange} />
      <button type="submit">Create Appointment</button>
    </form>
  );
}
