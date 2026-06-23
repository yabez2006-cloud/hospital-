const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  specialization: { type: String, required: true },
  availability: {
    type: String,
    enum: ["Available", "Unavailable"],
    default: "Available",
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Doctor", doctorSchema);
