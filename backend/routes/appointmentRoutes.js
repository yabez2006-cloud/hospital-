const express = require("express");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const memoryStore = require("../db/memoryStore");
const connectionState = require("../db/connectionState");
const { authenticate, requireRole } = require("../middleware/auth");
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

router.get("/", authenticate, async (req, res) => {
  try {
    let appointments;
    if (req.user.role === "admin") {
      appointments = connectionState.isMongoConnected
        ? await Appointment.find().populate("patient doctor").maxTimeMS(5000)
        : await memoryStore.appointments.find();
    } else if (req.user.role === "doctor") {
      const doctor = connectionState.isMongoConnected
        ? await Doctor.findOne({ username: req.user.username }).maxTimeMS(5000)
        : await memoryStore.doctors.findOne({ username: req.user.username });
      const doctorId = doctor?._id;
      appointments = connectionState.isMongoConnected
        ? await Appointment.find({ doctor: doctorId }).populate("patient doctor").maxTimeMS(5000)
        : (await memoryStore.appointments.find()).filter((appointment) => String(appointment.doctor) === String(doctorId));
    } else {
      const patient = connectionState.isMongoConnected
        ? await Patient.findOne({ username: req.user.username }).maxTimeMS(5000)
        : await memoryStore.patients.findOne({ username: req.user.username });
      const patientId = patient?._id;
      appointments = connectionState.isMongoConnected
        ? await Appointment.find({ patient: patientId }).populate("patient doctor").maxTimeMS(5000)
        : (await memoryStore.appointments.find()).filter((appointment) => String(appointment.patient) === String(patientId));
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

router.post("/", authenticate, requireRole("admin"), async (req, res) => {
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

router.get("/:id", authenticate, async (req, res) => {
  try {
    let appointment;
    if (connectionState.isMongoConnected) {
      appointment = await Appointment.findById(req.params.id).populate("patient doctor").maxTimeMS(5000);
    } else {
      appointment = await memoryStore.appointments.findById(req.params.id);
    }
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    if (req.user.role === "doctor") {
      const doctor = connectionState.isMongoConnected
        ? await Doctor.findOne({ username: req.user.username }).maxTimeMS(5000)
        : await memoryStore.doctors.findOne({ username: req.user.username });
      if (String(appointment.doctor?._id || appointment.doctor) !== String(doctor?._id)) {
        return res.status(403).json({ message: "You do not have permission to view this appointment" });
      }
    }

    if (req.user.role === "patient") {
      const patient = connectionState.isMongoConnected
        ? await Patient.findOne({ username: req.user.username }).maxTimeMS(5000)
        : await memoryStore.patients.findOne({ username: req.user.username });
      if (String(appointment.patient?._id || appointment.patient) !== String(patient?._id)) {
        return res.status(403).json({ message: "You do not have permission to view this appointment" });
      }
    }

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

router.put("/:id", authenticate, requireRole("admin"), async (req, res) => {
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

router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
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
