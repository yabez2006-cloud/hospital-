import { useState } from "react";

export default function PatientForm({ onSubmit }) {
  const [form, setForm] = useState({ name: "", username: "", age: "", gender: "", phone: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, age: Number(form.age) });
    setForm({ name: "", username: "", age: "", gender: "", phone: "" });
  };

  return (
    <form onSubmit={submit}>
      <h2>Create Patient</h2>
      <label>Name</label>
      <input name="name" value={form.name} onChange={handleChange} required />
      <label>Username</label>
      <input name="username" value={form.username} onChange={handleChange} required />
      <label>Age</label>
      <input name="age" type="number" value={form.age} onChange={handleChange} required />
      <label>Gender</label>
      <input name="gender" value={form.gender} onChange={handleChange} required />
      <label>Phone</label>
      <input name="phone" value={form.phone} onChange={handleChange} required />
      <button type="submit">Create Patient</button>
    </form>
  );
}
