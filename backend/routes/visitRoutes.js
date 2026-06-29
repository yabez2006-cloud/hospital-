const express = require('express');
const Visit = require('../models/Visit');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const memoryStore = require('../db/memoryStore');
const connectionState = require('../db/connectionState');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

async function findDoctorByUsername(username) {
  if (connectionState.isMongoConnected) return Doctor.findOne({ username }).maxTimeMS(5000);
  return memoryStore.doctors.findOne({ username });
}

async function findPatientByUsername(username) {
  if (connectionState.isMongoConnected) return Patient.findOne({ username }).maxTimeMS(5000);
  return memoryStore.patients.findOne({ username });
}

// Get visits for current doctor
router.get('/me', authenticate, requireRole('doctor'), async (req, res) => {
  try {
    const doctor = await findDoctorByUsername(req.user.username);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    if (connectionState.isMongoConnected) {
      const visits = await Visit.find({ doctor: doctor._id }).populate('patient').sort({ date: -1 }).maxTimeMS(5000);
      return res.json(visits);
    }

    const allVisits = await memoryStore.visits.find();
    const my = allVisits.filter(v => String(v.doctor) === String(doctor._id));
    res.json(my);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a visit record (doctor only)
router.post('/', authenticate, requireRole('doctor'), async (req, res) => {
  try {
    const { patientId, username, date, time, description, patientName } = req.body;
    const doctor = await findDoctorByUsername(req.user.username);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    let patient = null;
    if (patientId) {
      patient = connectionState.isMongoConnected ? await Patient.findById(patientId).maxTimeMS(5000) : await memoryStore.patients.findById(patientId);
    } else if (username) {
      patient = await findPatientByUsername(username);
    }

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const visitData = {
      doctor: doctor._id,
      patient: patient._id,
      patientName: patientName || patient.name || patient.username,
      date: date ? new Date(date) : new Date(),
      time: time || '',
      description: description || '',
    };

    if (connectionState.isMongoConnected) {
      const v = new Visit(visitData);
      await v.save();
      const full = await Visit.findById(v._id).populate('patient').maxTimeMS(5000);
      return res.status(201).json(full);
    }

    const v = await memoryStore.visits.create(visitData);
    res.status(201).json(v);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
