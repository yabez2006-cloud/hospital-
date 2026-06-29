const express = require("express");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const memoryStore = require("../db/memoryStore");
const Patient = require("../models/Patient");
const connectionState = require("../db/connectionState");
const { authenticate, requireRole } = require("../middleware/auth");
const router = express.Router();

async function findDoctorByUsername(username) {
  if (connectionState.isMongoConnected) {
    return Doctor.findOne({ username }).maxTimeMS(5000);
  }

  return memoryStore.doctors.findOne({ username });
}

async function findUserByUsername(username) {
  if (connectionState.isMongoConnected) {
    return User.findOne({ username }).maxTimeMS(5000);
  }

  return memoryStore.users.findOne({ username });
}

async function createUser(data) {
  if (connectionState.isMongoConnected) {
    const user = new User(data);
    return user.save();
  }

  return memoryStore.users.create(data);
}

router.get("/", authenticate, async (req, res) => {
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

router.get("/me", authenticate, requireRole("doctor"), async (req, res) => {
  try {
    const doctor = await findDoctorByUsername(req.user.username);
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });
    // populate visitedPatients when using MongoDB
    if (connectionState.isMongoConnected) {
      const full = await Doctor.findById(doctor._id).populate('visitedPatients').maxTimeMS(5000);
      return res.json(full);
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get visited patients list for current doctor
router.get('/me/visited', authenticate, requireRole('doctor'), async (req, res) => {
  try {
    const doctor = await findDoctorByUsername(req.user.username);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    if (connectionState.isMongoConnected) {
      const full = await Doctor.findById(doctor._id).populate('visitedPatients').maxTimeMS(5000);
      return res.json(full.visitedPatients || []);
    }

    // memory store fallback: doctor record may contain visitedPatients array of ids
    const allPatients = await memoryStore.patients.find();
    const visited = (doctor.visitedPatients || []).map((id) => allPatients.find((p) => String(p._id) === String(id))).filter(Boolean);
    res.json(visited);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Doctor adds a patient to their visited list by id or username
router.post('/me/visited', authenticate, requireRole('doctor'), async (req, res) => {
  try {
    const { patientId, username } = req.body;
    const doctor = await findDoctorByUsername(req.user.username);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    let patient;
    if (patientId) {
      patient = connectionState.isMongoConnected ? await Patient.findById(patientId).maxTimeMS(5000) : await memoryStore.patients.findById(patientId);
    } else if (username) {
      patient = await findPatientByUsername(username);
    }

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (connectionState.isMongoConnected) {
      // avoid duplicates
      const doc = await Doctor.findById(doctor._id).maxTimeMS(5000);
      const exists = (doc.visitedPatients || []).some((id) => String(id) === String(patient._id));
      if (!exists) {
        doc.visitedPatients = doc.visitedPatients || [];
        doc.visitedPatients.push(patient._id);
        await doc.save();
      }
      const full = await Doctor.findById(doctor._id).populate('visitedPatients').maxTimeMS(5000);
      return res.json(full.visitedPatients || []);
    }

    // memory store fallback
    const memDoc = await memoryStore.doctors.findOne({ username: req.user.username });
    memDoc.visitedPatients = memDoc.visitedPatients || [];
    if (!memDoc.visitedPatients.some((id) => String(id) === String(patient._id))) {
      memDoc.visitedPatients.push(patient._id);
    }
    const allPatients = await memoryStore.patients.find();
    res.json((memDoc.visitedPatients || []).map((id) => allPatients.find((p) => String(p._id) === String(id))).filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/me", authenticate, requireRole("doctor"), async (req, res) => {
  try {
    const doctor = await findDoctorByUsername(req.user.username);
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    let updatedDoctor;
    if (connectionState.isMongoConnected) {
      updatedDoctor = await Doctor.findByIdAndUpdate(doctor._id, req.body, { new: true }).maxTimeMS(5000);
    } else {
      updatedDoctor = await memoryStore.doctors.findByIdAndUpdate(doctor._id, req.body);
    }

    res.json(updatedDoctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { name, username, password, specialization, availability = "Available" } = req.body;
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const user = await createUser({ username, password, role: "doctor" });
    let doctor;
    if (connectionState.isMongoConnected) {
      doctor = new Doctor({ name, username, specialization, availability, user: user._id });
      doctor = await doctor.save().catch(() => {
        throw new Error("MongoDB unavailable");
      });
    } else {
      doctor = await memoryStore.doctors.create({ name, username, specialization, availability, user: user._id });
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

router.get("/:id", authenticate, async (req, res) => {
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

router.put("/:id", authenticate, requireRole("admin"), async (req, res) => {
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

router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
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
