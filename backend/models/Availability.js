const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  availableDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, enum: ["Available", "Pending", "Unavailable"], default: "Available" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Availability", availabilitySchema);
