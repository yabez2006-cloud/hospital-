const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  date: { type: Date, required: true },
  time: { type: String },
  availability: { type: mongoose.Schema.Types.ObjectId, ref: "Availability" },
  status: { type: String, enum: ["Pending", "Approved", "Rejected", "Completed"], default: "Pending" },
  patientName: { type: String },
  doctorName: { type: String },
  department: { type: String },
  notes: String,
});

module.exports = mongoose.model("Appointment", appointmentSchema);
