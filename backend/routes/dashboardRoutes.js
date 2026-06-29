const express = require("express");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const memoryStore = require("../db/memoryStore");
const connectionState = require("../db/connectionState");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function getCrowdStatus(count) {
  if (count > 50) return "High";
  if (count > 20) return "Medium";
  return "Low";
}

async function countAppointments(query = {}) {
  if (connectionState.isMongoConnected) {
    return Appointment.countDocuments(query);
  }

  const appointments = await memoryStore.appointments.find();
  return appointments.filter((appointment) =>
    Object.entries(query).every(([key, value]) => String(appointment[key]) === String(value))
  ).length;
}

async function getAppointments(query = {}) {
  if (connectionState.isMongoConnected) {
    return Appointment.find(query).populate("patient doctor").maxTimeMS(5000);
  }

  const appointments = await memoryStore.appointments.find();
  return appointments.filter((appointment) =>
    Object.entries(query).every(([key, value]) => String(appointment[key]) === String(value))
  );
}

async function countDoctors(query = {}) {
  if (connectionState.isMongoConnected) {
    return Doctor.countDocuments(query);
  }

  const doctors = await memoryStore.doctors.find();
  return doctors.filter((doctor) => Object.entries(query).every(([key, value]) => String(doctor[key]) === String(value))).length;
}

router.get("/", authenticate, async (req, res) => {
  try {
    const { role, username } = req.user;
    const allAppointments = await getAppointments();
    const crowdStatus = getCrowdStatus(allAppointments.length);

    if (role === "admin") {
        const patients = connectionState.isMongoConnected ? await Patient.countDocuments() : memoryStore.patients.count();
        const doctors = connectionState.isMongoConnected ? await Doctor.countDocuments() : memoryStore.doctors.count();

        // per-doctor stats
        const doctorDocs = connectionState.isMongoConnected ? await Doctor.find().maxTimeMS(5000) : await memoryStore.doctors.find();
        const doctorStats = await Promise.all(
          doctorDocs.map(async (d) => {
            const doctorId = d._id;
            const appointments = await getAppointments({ doctor: doctorId });
            const patientIds = new Set(appointments.map((a) => String(a.patient?._id || a.patient)).filter(Boolean));
            // prescriptions and reports counts
            const Prescription = require("../models/Prescription");
            const MedicalReport = require("../models/MedicalReport");
            const presCount = connectionState.isMongoConnected ? await Prescription.countDocuments({ doctor: doctorId }) : (await memoryStore.prescriptions.find()).filter((p) => String(p.doctor) === String(doctorId)).length;
            const repCount = connectionState.isMongoConnected ? await MedicalReport.countDocuments({ doctor: doctorId }) : (await memoryStore.medicalReports.find()).filter((r) => String(r.doctor) === String(doctorId)).length;

            return {
              doctor: d.name,
              patients: patientIds.size,
              todaysPatients: appointments.filter((a) => new Date(a.date).toDateString() === new Date().toDateString()).length,
              prescriptions: presCount,
              reports: repCount,
            };
          })
        );

        return res.json({
          role,
          patients,
          doctors,
          appointments: allAppointments.length,
          crowdStatus,
          doctorStats,
        });
    }

    if (role === "doctor") {
      const doctor = connectionState.isMongoConnected
        ? await Doctor.findOne({ username }).maxTimeMS(5000)
        : await memoryStore.doctors.findOne({ username });

      const doctorId = doctor?._id;
      const doctorAppointments = doctorId ? await getAppointments({ doctor: doctorId }) : [];
      const patientIds = new Set(
        doctorAppointments.map((appointment) => String(appointment.patient?._id || appointment.patient)).filter(Boolean)
      );

      return res.json({
        role,
        appointments: doctorAppointments.length,
        availabilityStatus: doctor?.availability || "Available",
        patientsAssigned: patientIds.size,
        crowdStatus,
      });
    }

    const patient = connectionState.isMongoConnected
      ? await Patient.findOne({ username }).populate("favoriteDoctor").maxTimeMS(5000)
      : await memoryStore.patients.findOne({ username });

    const patientAppointments = patient ? await countAppointments({ patient: patient._id }) : 0;
    const favoriteDoctor =
      patient?.favoriteDoctor && !connectionState.isMongoConnected
        ? await memoryStore.doctors.findById(patient.favoriteDoctor)
        : patient?.favoriteDoctor || null;

    return res.json({
      role,
      doctors: await countDoctors({ availability: "Available" }),
      appointments: patientAppointments,
      favoriteDoctor,
      crowdStatus,
    });
  } catch (error) {
    const appointments = await memoryStore.appointments.find();
    res.json({
      role: req.user.role,
      patients: memoryStore.patients.count(),
      doctors: memoryStore.doctors.count(),
      appointments: appointments.length,
      crowdStatus: getCrowdStatus(appointments.length),
    });
  }
});

module.exports = router;