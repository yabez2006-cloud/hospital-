import { useState } from "react";
import { uploadReport } from "../api";

export default function ReportUpload({ patientId, doctorId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select a file");
    setUploading(true);
    try {
      await uploadReport(file, { patient: patientId, doctor: doctorId });
      setFile(null);
      onUploaded && onUploaded();
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} encType="multipart/form-data">
      <h3>Upload Medical Report</h3>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="application/pdf,image/*" />
      <button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</button>
    </form>
  );
}
