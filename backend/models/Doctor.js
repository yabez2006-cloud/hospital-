const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  availability: {
    type: String,
    enum: ["Available", "Unavailable"],
    default: "Available",
  },
});

module.exports = mongoose.model("Doctor", doctorSchema);
