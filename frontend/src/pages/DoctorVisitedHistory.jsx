import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchMyVisits, createVisit } from "../api";
import { getAuthUser } from "../auth";

export default function DoctorVisitedHistory() {
  const user = getAuthUser();
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", patientName: "", date: "", time: "", description: "" });

  useEffect(() => {
    if (user?.role !== "doctor") return;
    const load = async () => {
      try {
        const v = await fetchMyVisits();
        setVisits(v || []);
      } catch (e) {
        setError(e.message);
      }
    };
    load();
  }, [user?.role]);

  if (user?.role !== "doctor") return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const created = await createVisit({ username: form.username, patientName: form.patientName, date: form.date, time: form.time, description: form.description });
      setVisits((s) => [created, ...s]);
      setForm({ username: "", patientName: "", date: "", time: "", description: "" });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <h2>Patient Visited History</h2>
      {error && <div className="error">{error}</div>}

      <form onSubmit={submit} className="card">
        <input placeholder="Patient username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        <input placeholder="Patient name" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        <textarea placeholder="Medical description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button type="submit">Add Visit</button>
      </form>

      <div style={{ marginTop: 16 }}>
        <h3>Recent Visits</h3>
        <ul>
          {visits.map((v) => (
            <li key={v._id || v.createdAt}>
              <strong>{v.patientName || v.patient?.name || v.patient?.username}</strong> — {new Date(v.date).toLocaleDateString()} {v.time} <br />
              {v.description}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
