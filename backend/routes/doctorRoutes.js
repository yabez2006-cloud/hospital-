const express = require("express");
const Doctor = require("../models/Doctor");
const memoryStore = require("../db/memoryStore");
const connectionState = require("../db/connectionState");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    let doctors;
    if (connectionState.isMongoConnected) {
      doctors = await Doctor.find().maxTimeMS(5000);
    } else {
      doctors = await memoryStore.doctors.find();
    }
    res.json(doctors);
  } catch (error) {
    console.warn("Doctor.find() error, using memory store:", error.message);
    try {
      const doctors = await memoryStore.doctors.find();
      res.json(doctors);
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(500).json({ error: fallbackError.message });
    }
  }
});

router.post("/", async (req, res) => {
  try {
    let doctor;
    if (connectionState.isMongoConnected) {
      doctor = new Doctor(req.body);
      doctor = await doctor.save().catch(() => {
        throw new Error("MongoDB unavailable");
      });
    } else {
      doctor = await memoryStore.doctors.create(req.body);
    }
    res.status(201).json(doctor);
  } catch (error) {
    console.warn("Doctor.create() error, using memory store:", error.message);
    try {
      const doctor = await memoryStore.doctors.create(req.body);
      res.status(201).json(doctor);
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(400).json({ error: fallbackError.message });
    }
  }
});

router.get("/:id", async (req, res) => {
  try {
    let doctor;
    if (connectionState.isMongoConnected) {
      doctor = await Doctor.findById(req.params.id).maxTimeMS(5000);
    } else {
      doctor = await memoryStore.doctors.findById(req.params.id);
    }
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json(doctor);
  } catch (error) {
    console.warn("Doctor.findById() error, using memory store:", error.message);
    try {
      const doctor = await memoryStore.doctors.findById(req.params.id);
      if (!doctor) return res.status(404).json({ error: "Doctor not found" });
      res.json(doctor);
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(500).json({ error: fallbackError.message });
    }
  }
});

router.put("/:id", async (req, res) => {
  try {
    let doctor;
    if (connectionState.isMongoConnected) {
      doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true }).maxTimeMS(5000);
    } else {
      doctor = await memoryStore.doctors.findByIdAndUpdate(req.params.id, req.body);
    }
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json(doctor);
  } catch (error) {
    console.warn("Doctor.findByIdAndUpdate() error, using memory store:", error.message);
    try {
      const doctor = await memoryStore.doctors.findByIdAndUpdate(req.params.id, req.body);
      if (!doctor) return res.status(404).json({ error: "Doctor not found" });
      res.json(doctor);
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(400).json({ error: fallbackError.message });
    }
  }
});

router.delete("/:id", async (req, res) => {
  try {
    let doctor;
    if (connectionState.isMongoConnected) {
      doctor = await Doctor.findByIdAndDelete(req.params.id).maxTimeMS(5000);
    } else {
      doctor = await memoryStore.doctors.findByIdAndDelete(req.params.id);
    }
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json({ message: "Doctor deleted" });
  } catch (error) {
    console.warn("Doctor.findByIdAndDelete() error, using memory store:", error.message);
    try {
      const doctor = await memoryStore.doctors.findByIdAndDelete(req.params.id);
      if (!doctor) return res.status(404).json({ error: "Doctor not found" });
      res.json({ message: "Doctor deleted" });
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(500).json({ error: fallbackError.message });
    }
  }
});

module.exports = router;
