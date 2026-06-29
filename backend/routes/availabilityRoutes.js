const express = require("express");
const router = express.Router();
const Availability = require("../models/Availability");

// Create availability slot
router.post("/", async (req, res) => {
  try {
    const slot = new Availability(req.body);
    await slot.save();
    res.status(201).json(slot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get availability for a doctor
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const slots = await Availability.find({ doctor: req.params.doctorId, status: "Available" }).sort({ availableDate: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get availability by date (YYYY-MM-DD)
router.get("/date/:date", async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const slots = await Availability.find({ availableDate: { $gte: date, $lt: next }, status: "Available" });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update slot
router.put("/:id", async (req, res) => {
  try {
    const slot = await Availability.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(slot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete slot
router.delete("/:id", async (req, res) => {
  try {
    await Availability.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
