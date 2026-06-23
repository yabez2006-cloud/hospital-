import { useState } from "react";

export default function DoctorForm({ onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    specialization: "",
    availability: "Available",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form);
    setForm({ name: "", username: "", password: "", specialization: "", availability: "Available" });
  };

  return (
    <form onSubmit={submit}>
      <h2>Create Doctor</h2>
      <label>Doctor Name</label>
      <input name="name" value={form.name} onChange={handleChange} required />
      <label>Username</label>
      <input name="username" value={form.username} onChange={handleChange} required />
      <label>Password</label>
      <input name="password" type="password" value={form.password} onChange={handleChange} required />
      <label>Specialization</label>
      <input name="specialization" value={form.specialization} onChange={handleChange} required />
      <label>Availability</label>
      <select name="availability" value={form.availability} onChange={handleChange}>
        <option value="Available">Available</option>
        <option value="Unavailable">Unavailable</option>
      </select>
      <button type="submit">Create Doctor</button>
    </form>
  );
}
