const express = require("express");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const memoryStore = require("../db/memoryStore");
const connectionState = require("../db/connectionState");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const patients = connectionState.isMongoConnected
      ? await Patient.countDocuments()
      : memoryStore.patients.count();
    const doctors = connectionState.isMongoConnected
      ? await Doctor.countDocuments()
      : memoryStore.doctors.count();
    const appointments = connectionState.isMongoConnected
      ? await Appointment.countDocuments()
      : memoryStore.appointments.count();

    let crowdStatus = "Low";
    if (appointments > 20) crowdStatus = "Medium";
    if (appointments > 50) crowdStatus = "High";

    res.json({ patients, doctors, appointments, crowdStatus });
  } catch (error) {
    const patients = memoryStore.patients.count();
    const doctors = memoryStore.doctors.count();
    const appointments = memoryStore.appointments.count();
    let crowdStatus = "Low";
    if (appointments > 20) crowdStatus = "Medium";
    if (appointments > 50) crowdStatus = "High";
    res.json({ patients, doctors, appointments, crowdStatus });
  }
});

module.exports = router;