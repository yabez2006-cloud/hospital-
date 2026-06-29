const express = require("express");
const router = express.Router();
const Favorite = require("../models/Favorite");

// Add favorite
router.post("/", async (req, res) => {
  try {
    const fav = new Favorite(req.body);
    await fav.save();
    res.status(201).json(fav);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get favorites for a patient
router.get("/patient/:patientId", async (req, res) => {
  try {
    const list = await Favorite.find({ patient: req.params.patientId }).populate("doctor");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove favorite
router.delete("/:id", async (req, res) => {
  try {
    await Favorite.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
