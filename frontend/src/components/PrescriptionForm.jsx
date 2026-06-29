import { useState } from "react";
import { createPrescription } from "../api";

export default function PrescriptionForm({ patientId, doctorId, onSaved }) {
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", frequency: "" }]);
  const [notes, setNotes] = useState("");
  const [nextVisit, setNextVisit] = useState("");

  const handleMedicineChange = (idx, field, value) => {
    const arr = medicines.slice();
    arr[idx][field] = value;
    setMedicines(arr);
  };

  const addMedicine = () => setMedicines((m) => [...m, { name: "", dosage: "", frequency: "" }]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createPrescription({ patient: patientId, doctor: doctorId, diagnosis, medicines, notes, nextVisit: nextVisit || null });
      setDiagnosis(""); setMedicines([{ name: "", dosage: "", frequency: "" }]); setNotes(""); setNextVisit("");
      onSaved && onSaved();
    } catch (err) {
      alert(err.message || "Error");
    }
  };

  return (
    <form onSubmit={submit}>
      <h3>Add Prescription</h3>
      <label>Diagnosis</label>
      <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
      <div>
        <h4>Medicines</h4>
        {medicines.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <input placeholder="Name" value={m.name} onChange={(e) => handleMedicineChange(i, "name", e.target.value)} required />
            <input placeholder="Dosage" value={m.dosage} onChange={(e) => handleMedicineChange(i, "dosage", e.target.value)} />
            <input placeholder="Frequency" value={m.frequency} onChange={(e) => handleMedicineChange(i, "frequency", e.target.value)} />
          </div>
        ))}
        <button type="button" onClick={addMedicine}>Add Medicine</button>
      </div>
      <label>Notes</label>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      <label>Next Visit</label>
      <input type="date" value={nextVisit} onChange={(e) => setNextVisit(e.target.value)} />
      <button type="submit">Save Prescription</button>
    </form>
  );
}
