const express = require("express");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const memoryStore = require("../db/memoryStore");
const connectionState = require("../db/connectionState");
const { authenticate, requireRole } = require("../middleware/auth");
const router = express.Router();

const Availability = require("../models/Availability");


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

// Patient booking endpoint: create a pending appointment request and mark slot pending
router.post("/book", authenticate, requireRole("patient"), async (req, res) => {
  try {
    const { doctor: doctorId, availableDate, startTime, notes } = req.body;
    const patient = connectionState.isMongoConnected
      ? await Patient.findOne({ username: req.user.username }).maxTimeMS(5000)
      : await memoryStore.patients.findOne({ username: req.user.username });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const date = new Date(availableDate);
    const slot = await Availability.findOne({ doctor: doctorId, availableDate: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) }, startTime, status: "Available" });
    if (!slot) return res.status(400).json({ message: "Selected slot is not available" });

    let appointment;
    if (connectionState.isMongoConnected) {
      appointment = new Appointment({ patient: patient._id, doctor: doctorId, date: date, time: startTime, availability: slot._id, status: "Pending", notes, patientName: patient.name });
      await appointment.save();
      appointment = await Appointment.findById(appointment._id).populate("patient doctor").maxTimeMS(5000);
    } else {
      appointment = await memoryStore.appointments.create({ patient: patient._id, doctor: doctorId, date: date, time: startTime, status: "Pending", notes });
    }

    // mark slot pending so others can't take it until doctor approves/rejects
    slot.status = "Pending";
    await slot.save();

    // notify doctor about request
    try {
      const notify = require('../utils/notify');
      await notify.notifyAppointmentRequested(doctorId, patient, appointment);
    } catch (e) {
      console.warn('notify error', e.message);
    }

    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Doctor approves appointment
router.post('/:id/approve', authenticate, requireRole('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // ensure doctor owns the appointment
    const doctor = connectionState.isMongoConnected ? await Doctor.findOne({ username: req.user.username }).maxTimeMS(5000) : await memoryStore.doctors.findOne({ username: req.user.username });
    if (!doctor || String(appointment.doctor) !== String(doctor._id)) return res.status(403).json({ message: 'Not authorized' });

    appointment.status = 'Approved';
    await appointment.save();

    // mark availability unavailable
    if (appointment.availability) {
      const slot = await Availability.findById(appointment.availability);
      if (slot) {
        slot.status = 'Unavailable';
        await slot.save();
      }
    }

    // notify patient about approval
    try {
      const notify = require('../utils/notify');
      await notify.notifyAppointmentStatusToPatient(appointment.patient, appointment, 'Approved');
    } catch (e) { console.warn('notify error', e.message); }

    const updated = await Appointment.findById(appointment._id).populate('patient doctor');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Doctor rejects appointment
router.post('/:id/reject', authenticate, requireRole('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const doctor = connectionState.isMongoConnected ? await Doctor.findOne({ username: req.user.username }).maxTimeMS(5000) : await memoryStore.doctors.findOne({ username: req.user.username });
    if (!doctor || String(appointment.doctor) !== String(doctor._id)) return res.status(403).json({ message: 'Not authorized' });

    appointment.status = 'Rejected';
    await appointment.save();

    // free the availability slot
    if (appointment.availability) {
      const slot = await Availability.findById(appointment.availability);
      if (slot) {
        slot.status = 'Available';
        await slot.save();
      }
    }

    // notify patient about rejection
    try {
      const notify = require('../utils/notify');
      await notify.notifyAppointmentStatusToPatient(appointment.patient, appointment, 'Rejected');
    } catch (e) { console.warn('notify error', e.message); }

    const updated = await Appointment.findById(appointment._id).populate('patient doctor');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Doctor marks appointment completed
router.post('/:id/complete', authenticate, requireRole('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const doctor = connectionState.isMongoConnected 
      ? await Doctor.findOne({ username: req.user.username }).maxTimeMS(5000) 
      : await memoryStore.doctors.findOne({ username: req.user.username });
    if (!doctor || String(appointment.doctor) !== String(doctor._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = 'Completed';
    await appointment.save();

    const updated = await Appointment.findById(appointment._id).populate('patient doctor');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// (routes moved above to avoid route conflicts with :id)

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

// Patient: list completed appointments (visits) for the patient
router.get('/my-doctors', authenticate, requireRole('patient'), async (req, res) => {
  try {
    const patient = connectionState.isMongoConnected
      ? await Patient.findOne({ username: req.user.username }).maxTimeMS(5000)
      : await memoryStore.patients.findOne({ username: req.user.username });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (connectionState.isMongoConnected) {
      const appointments = await Appointment.find({ patient: patient._id, status: 'Completed' })
        .populate('doctor')
        .sort({ date: -1, time: -1 })
        .maxTimeMS(5000);
      return res.json(appointments);
    }

    // memory store fallback
    const appointments = (await memoryStore.appointments.find())
      .filter(a => String(a.patient) === String(patient._id) && a.status === 'Completed');
    
    // Sort memory store appointments by date (newest first)
    appointments.sort((a, b) => new Date(b.date) - new Date(a.date));

    const result = [];
    for (const a of appointments) {
      const doc = (await memoryStore.doctors.find()).find(d => String(d._id) === String(a.doctor));
      result.push({
        ...a,
        doctor: doc || { _id: a.doctor, name: 'Doctor' }
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Doctor: list patients the doctor has treated (appointments completed)
router.get('/my-patients', authenticate, requireRole('doctor'), async (req, res) => {
  try {
    const doctor = connectionState.isMongoConnected
      ? await Doctor.findOne({ username: req.user.username }).maxTimeMS(5000)
      : await memoryStore.doctors.findOne({ username: req.user.username });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    if (connectionState.isMongoConnected) {
      const appointments = await Appointment.find({ doctor: doctor._id, status: 'Completed' }).populate('patient').maxTimeMS(5000);
      const patients = [];
      const seen = new Set();
      for (const ap of appointments) {
        const p = ap.patient;
        if (p && !seen.has(String(p._id))) {
          seen.add(String(p._id));
          patients.push(p);
        }
      }
      return res.json(patients);
    }

    // memory store fallback
    const appointments = (await memoryStore.appointments.find()).filter(a => String(a.doctor) === String(doctor._id) && a.status === 'Completed');
    const seen = new Set();
    const patients = [];
    for (const a of appointments) {
      const pat = (await memoryStore.patients.find()).find(p => String(p._id) === String(a.patient));
      if (pat && !seen.has(String(pat._id))) {
        seen.add(String(pat._id));
        patients.push(pat);
      }
    }
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
