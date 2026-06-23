const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: { type: String },
  age: { type: Number },
  gender: { type: String },
  phone: { type: String },
  username: { type: String, unique: true, sparse: true },
  favoriteDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Patient", patientSchema);
