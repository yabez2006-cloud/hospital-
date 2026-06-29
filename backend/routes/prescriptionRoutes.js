const express = require("express");
const router = express.Router();
const Prescription = require("../models/Prescription");

// Create prescription
router.post("/", async (req, res) => {
  try {
    const p = new Prescription(req.body);
    await p.save();
    res.status(201).json(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get prescriptions for a patient
router.get("/patient/:patientId", async (req, res) => {
  try {
    const list = await Prescription.find({ patient: req.params.patientId }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get prescription by appointment
router.get("/appointment/:appointmentId", async (req, res) => {
  try {
    const pres = await Prescription.findOne({ appointment: req.params.appointmentId });
    res.json(pres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single prescription
router.get("/:id", async (req, res) => {
  try {
    const pres = await Prescription.findById(req.params.id);
    res.json(pres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
