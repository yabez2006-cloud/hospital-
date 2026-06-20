const express = require("express");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const memoryStore = require("../db/memoryStore");
const connectionState = require("../db/connectionState");
const router = express.Router();

async function getDoctorById(doctorId) {
  if (connectionState.isMongoConnected) {
    return Doctor.findById(doctorId).maxTimeMS(5000);
  }

  return memoryStore.doctors.findById(doctorId);
}

async function ensureAvailableDoctor(req, res) {
  const doctorId = req.body.doctorId || req.body.doctor;
  const doctor = await getDoctorById(doctorId);

  if (!doctor) {
    res.status(404).json({ message: "Doctor not found" });
    return null;
  }

  if (doctor.availability === "Unavailable") {
    res.status(400).json({ message: "Doctor is unavailable" });
    return null;
  }

  return doctorId;
}

router.get("/", async (req, res) => {
  try {
    let appointments;
    if (connectionState.isMongoConnected) {
      appointments = await Appointment.find().populate("patient doctor").maxTimeMS(5000);
    } else {
      appointments = await memoryStore.appointments.find();
    }
    res.json(appointments);
  } catch (error) {
    console.warn("Appointment.find() error, using memory store:", error.message);
    try {
      const appointments = await memoryStore.appointments.find();
      res.json(appointments);
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(500).json({ error: fallbackError.message });
    }
  }
});

router.post("/", async (req, res) => {
  try {
    const doctorId = await ensureAvailableDoctor(req, res);
    if (!doctorId) return;

    let appointment;
    if (connectionState.isMongoConnected) {
      appointment = new Appointment({ ...req.body, doctor: doctorId });
      appointment = await appointment.save().catch(() => {
        throw new Error("MongoDB unavailable");
      });
      appointment = await Appointment.findById(appointment._id).populate("patient doctor");
    } else {
      appointment = await memoryStore.appointments.create({ ...req.body, doctor: doctorId });
    }
    res.status(201).json(appointment);
  } catch (error) {
    console.warn("Appointment.create() error, using memory store:", error.message);
    try {
      const appointment = await memoryStore.appointments.create(req.body);
      res.status(201).json(appointment);
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(400).json({ error: fallbackError.message });
    }
  }
});

router.get("/:id", async (req, res) => {
  try {
    let appointment;
    if (connectionState.isMongoConnected) {
      appointment = await Appointment.findById(req.params.id).populate("patient doctor").maxTimeMS(5000);
    } else {
      appointment = await memoryStore.appointments.findById(req.params.id);
    }
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json(appointment);
  } catch (error) {
    console.warn("Appointment.findById() error, using memory store:", error.message);
    try {
      const appointment = await memoryStore.appointments.findById(req.params.id);
      if (!appointment) return res.status(404).json({ error: "Appointment not found" });
      res.json(appointment);
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(500).json({ error: fallbackError.message });
    }
  }
});

router.put("/:id", async (req, res) => {
  try {
    const doctorId = await ensureAvailableDoctor(req, res);
    if (!doctorId) return;

    let appointment;
    if (connectionState.isMongoConnected) {
      appointment = await Appointment.findByIdAndUpdate(req.params.id, { ...req.body, doctor: doctorId }, { new: true }).populate("patient doctor").maxTimeMS(5000);
    } else {
      appointment = await memoryStore.appointments.findByIdAndUpdate(req.params.id, { ...req.body, doctor: doctorId });
    }
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json(appointment);
  } catch (error) {
    console.warn("Appointment.findByIdAndUpdate() error, using memory store:", error.message);
    try {
      const appointment = await memoryStore.appointments.findByIdAndUpdate(req.params.id, req.body);
      if (!appointment) return res.status(404).json({ error: "Appointment not found" });
      res.json(appointment);
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(400).json({ error: fallbackError.message });
    }
  }
});

router.delete("/:id", async (req, res) => {
  try {
    let appointment;
    if (connectionState.isMongoConnected) {
      appointment = await Appointment.findByIdAndDelete(req.params.id).maxTimeMS(5000);
    } else {
      appointment = await memoryStore.appointments.findByIdAndDelete(req.params.id);
    }
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json({ message: "Appointment deleted" });
  } catch (error) {
    console.warn("Appointment.findByIdAndDelete() error, using memory store:", error.message);
    try {
      const appointment = await memoryStore.appointments.findByIdAndDelete(req.params.id);
      if (!appointment) return res.status(404).json({ error: "Appointment not found" });
      res.json({ message: "Appointment deleted" });
      connectionState.isMongoConnected = false;
    } catch (fallbackError) {
      res.status(500).json({ error: fallbackError.message });
    }
  }
});

module.exports = router;
