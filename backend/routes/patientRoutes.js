const express = require("express");
const Patient = require("../models/Patient");
const memoryStore = require("../db/memoryStore");
const connectionState = require("../db/connectionState");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    let patients;
    if (connectionState.isMongoConnected) {
      patients = await Patient.find().maxTimeMS(5000);
    } else {
      patients = await memoryStore.patients.find();
    }
    res.json(patients);
  } catch (error) {
    console.warn("Patient.find() error, using memory store:", error.message);
    try {
      const patients = await memoryStore.patients.find();
      res.json(patients);
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(500).json({ error: fallbackError.message });
    }
  }
});

router.post("/", async (req, res) => {
  try {
    let patient;
    if (connectionState.isMongoConnected) {
      patient = new Patient(req.body);
      patient = await patient.save().catch(() => {
        throw new Error("MongoDB unavailable");
      });
    } else {
      patient = await memoryStore.patients.create(req.body);
    }
    res.status(201).json(patient);
  } catch (error) {
    console.warn("Patient.create() error, using memory store:", error.message);
    try {
      const patient = await memoryStore.patients.create(req.body);
      res.status(201).json(patient);
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(400).json({ error: fallbackError.message });
    }
  }
});

router.get("/:id", async (req, res) => {
  try {
    let patient;
    if (connectionState.isMongoConnected) {
      patient = await Patient.findById(req.params.id).maxTimeMS(5000);
    } else {
      patient = await memoryStore.patients.findById(req.params.id);
    }
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (error) {
    console.warn("Patient.findById() error, using memory store:", error.message);
    try {
      const patient = await memoryStore.patients.findById(req.params.id);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      res.json(patient);
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(500).json({ error: fallbackError.message });
    }
  }
});

router.put("/:id", async (req, res) => {
  try {
    let patient;
    if (connectionState.isMongoConnected) {
      patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true }).maxTimeMS(5000);
    } else {
      patient = await memoryStore.patients.findByIdAndUpdate(req.params.id, req.body);
    }
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (error) {
    console.warn("Patient.findByIdAndUpdate() error, using memory store:", error.message);
    try {
      const patient = await memoryStore.patients.findByIdAndUpdate(req.params.id, req.body);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      res.json(patient);
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(400).json({ error: fallbackError.message });
    }
  }
});

router.delete("/:id", async (req, res) => {
  try {
    let patient;
    if (connectionState.isMongoConnected) {
      patient = await Patient.findByIdAndDelete(req.params.id).maxTimeMS(5000);
    } else {
      patient = await memoryStore.patients.findByIdAndDelete(req.params.id);
    }
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json({ message: "Patient deleted" });
  } catch (error) {
    console.warn("Patient.findByIdAndDelete() error, using memory store:", error.message);
    try {
      const patient = await memoryStore.patients.findByIdAndDelete(req.params.id);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      res.json({ message: "Patient deleted" });
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(500).json({ error: fallbackError.message });
    }
  }
});

module.exports = router;
