import { useState } from "react";
import { createPrescription, uploadReport } from "../api";

export default function ConsultationForm({ appointment, onCompleted, onCancel }) {
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", frequency: "" }]);
  const [notes, setNotes] = useState("");
  const [nextVisit, setNextVisit] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleMedicineChange = (idx, field, value) => {
    const arr = medicines.slice();
    arr[idx][field] = value;
    setMedicines(arr);
  };

  const addMedicine = () => setMedicines((m) => [...m, { name: "", dosage: "", frequency: "" }]);
  const removeMedicine = (idx) => setMedicines((m) => m.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const patientId = appointment.patient?._id || appointment.patient;
      const doctorId = appointment.doctor?._id || appointment.doctor;

      // 1. Save prescription
      await createPrescription({
        patient: patientId,
        doctor: doctorId,
        appointment: appointment._id,
        diagnosis,
        medicines,
        notes,
        nextVisit: nextVisit || null,
      });

      // 2. Upload report if provided
      if (file) {
        await uploadReport(file, {
          patient: patientId,
          doctor: doctorId,
          reportType: file.type || "Medical Report",
        });
      }

      // 3. Mark appointment completed
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/appointments/${appointment._id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to complete appointment");
      }

      alert("Consultation recorded & appointment completed successfully!");
      onCompleted && onCompleted();
    } catch (err) {
      alert(err.message || "Error submitting consultation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="consultation-form card" style={{ marginTop: 12, padding: 16 }}>
      <h3>Examine Patient & Add Consultation</h3>
      <p style={{ fontSize: "0.9em", color: "#666" }}>
        Patient: <strong>{appointment.patient?.name || appointment.patientName}</strong>
      </p>

      <label>Diagnosis *</label>
      <input
        type="text"
        value={diagnosis}
        onChange={(e) => setDiagnosis(e.target.value)}
        placeholder="Enter diagnosis details..."
        required
      />

      <div style={{ margin: "12px 0" }}>
        <h4>Medicines</h4>
        {medicines.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <input
              placeholder="Medicine Name *"
              value={m.name}
              onChange={(e) => handleMedicineChange(i, "name", e.target.value)}
              required
              style={{ flex: 2 }}
            />
            <input
              placeholder="Dosage"
              value={m.dosage}
              onChange={(e) => handleMedicineChange(i, "dosage", e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              placeholder="Frequency"
              value={m.frequency}
              onChange={(e) => handleMedicineChange(i, "frequency", e.target.value)}
              style={{ flex: 1 }}
            />
            {medicines.length > 1 && (
              <button type="button" className="btn-delete" onClick={() => removeMedicine(i)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={addMedicine}>
          + Add Medicine
        </button>
      </div>

      <label>Clinical Notes</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Enter clinical notes, instructions, etc."
        rows={3}
      />

      <label>Next Visit Date</label>
      <input
        type="date"
        value={nextVisit}
        onChange={(e) => setNextVisit(e.target.value)}
        min={new Date().toISOString().split("T")[0]}
      />

      <label>Upload Medical Report (Optional)</label>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        accept="application/pdf,image/*"
        style={{ marginBottom: 12 }}
      />

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Save Prescription & Complete Appointment"}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
