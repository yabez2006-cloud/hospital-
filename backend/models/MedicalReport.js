const mongoose = require("mongoose");

const medicalReportSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  reportType: { type: String },
  reportFile: { type: String },
  fileId: { type: mongoose.Schema.Types.ObjectId },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MedicalReport", medicalReportSchema);
