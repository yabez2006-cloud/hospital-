import { useState } from "react";
import { createAvailability } from "../api";

export default function AvailabilityForm({ doctorId, onSaved }) {
  const [form, setForm] = useState({ availableDate: "", startTime: "09:00", endTime: "10:00", status: "Available" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAvailability({ doctor: doctorId, availableDate: form.availableDate, startTime: form.startTime, endTime: form.endTime, status: form.status });
      setForm({ availableDate: "", startTime: "09:00", endTime: "10:00", status: "Available" });
      onSaved && onSaved();
    } catch (err) {
      alert(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <h3>Set Availability</h3>
      <label>Date</label>
      <input name="availableDate" type="date" value={form.availableDate} onChange={handleChange} required />
      <label>Start Time</label>
      <input name="startTime" type="time" value={form.startTime} onChange={handleChange} required />
      <label>End Time</label>
      <input name="endTime" type="time" value={form.endTime} onChange={handleChange} required />
      <label>Status</label>
      <select name="status" value={form.status} onChange={handleChange}>
        <option>Available</option>
        <option>Unavailable</option>
      </select>
      <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
    </form>
  );
}
