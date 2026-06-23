const express = require("express");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const memoryStore = require("../db/memoryStore");
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
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
