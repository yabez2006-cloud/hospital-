const express = require("express");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const memoryStore = require("../db/memoryStore");
const connectionState = require("../db/connectionState");
const { authenticate, requireRole } = require("../middleware/auth");
const router = express.Router();

async function createUser(data) {
  if (connectionState.isMongoConnected) {
    const user = new User(data);
    return user.save();
  }

  return memoryStore.users.create(data);
}

async function findPatientByUsername(username) {
  if (connectionState.isMongoConnected) {
    return Patient.findOne({ username }).maxTimeMS(5000);
  }

  return memoryStore.patients.findOne({ username });
}

async function findDoctorById(doctorId) {
  if (connectionState.isMongoConnected) {
    return Doctor.findById(doctorId).maxTimeMS(5000);
  }

  return memoryStore.doctors.findById(doctorId);
}

router.get("/", authenticate, requireRole("admin"), async (req, res) => {
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

router.get("/me", authenticate, requireRole("patient"), async (req, res) => {
  try {
    const patient = await findPatientByUsername(req.user.username);
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const favoriteDoctor = patient.favoriteDoctor ? await findDoctorById(patient.favoriteDoctor) : null;
    const patientData = connectionState.isMongoConnected && typeof patient.toObject === "function" ? patient.toObject() : patient;

    res.json({ ...patientData, favoriteDoctor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/me/favorite-doctor", authenticate, requireRole("patient"), async (req, res) => {
  try {
    const { favoriteDoctor } = req.body;
    const patient = await findPatientByUsername(req.user.username);
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    let updatedPatient;
    if (connectionState.isMongoConnected) {
      updatedPatient = await Patient.findByIdAndUpdate(patient._id, { favoriteDoctor }, { new: true }).maxTimeMS(5000);
    } else {
      updatedPatient = await memoryStore.patients.findByIdAndUpdate(patient._id, { favoriteDoctor });
    }

    const resolvedFavoriteDoctor = favoriteDoctor ? await findDoctorById(favoriteDoctor) : null;
    res.json({ ...updatedPatient, favoriteDoctor: resolvedFavoriteDoctor });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { username, password } = req.body;
    let user = null;

    if (password) {
      const existingUser = await User.findOne({ username }).maxTimeMS(5000);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      user = await createUser({ username, password, role: "patient" });
    }

    let patient;
    if (connectionState.isMongoConnected) {
      patient = new Patient({
        ...req.body,
        user: user?._id,
      });
      patient = await patient.save().catch(() => {
        throw new Error("MongoDB unavailable");
      });
    } else {
      patient = await memoryStore.patients.create({
        ...req.body,
        user: user?._id,
      });
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

router.get("/:id", authenticate, requireRole("admin"), async (req, res) => {
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

router.put("/:id", authenticate, requireRole("admin"), async (req, res) => {
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

router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
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
