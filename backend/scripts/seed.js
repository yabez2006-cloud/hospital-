require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Availability = require('../models/Availability');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const MedicalReport = require('../models/MedicalReport');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  await Promise.all([
    User.deleteMany(),
    Doctor.deleteMany(),
    Patient.deleteMany(),
    Availability.deleteMany(),
    Appointment.deleteMany(),
    Prescription.deleteMany(),
    MedicalReport.deleteMany()
  ]);

  const drUser1 = await User.create({ username: 'drkumar', password: '1234', role: 'doctor' });
  const dr1 = await Doctor.create({ name: 'Dr. Kumar', username: 'drkumar', specialization: 'Cardiology', user: drUser1._id });

  const drUser2 = await User.create({ username: 'drjohn', password: '1234', role: 'doctor' });
  const dr2 = await Doctor.create({ name: 'Dr. John', username: 'drjohn', specialization: 'General', user: drUser2._id });

  const pUser1 = await User.create({ username: 'alice', password: '1234', role: 'patient' });
  const p1 = await Patient.create({ name: 'Alice', username: 'alice', user: pUser1._id });

  const pUser2 = await User.create({ username: 'bob', password: '1234', role: 'patient' });
  const p2 = await Patient.create({ name: 'Bob', username: 'bob', user: pUser2._id });

  const today = new Date();
  const slot1 = await Availability.create({ doctor: dr1._id, availableDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()), startTime: '09:00', endTime: '09:30' });
  const slot2 = await Availability.create({ doctor: dr1._id, availableDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()), startTime: '10:00', endTime: '10:30' });

  await Appointment.create({ patient: p1._id, doctor: dr1._id, date: new Date(), time: '09:00', status: 'Approved', patientName: p1.name, doctorName: dr1.name });

  await Prescription.create({ patient: p1._id, doctor: dr1._id, diagnosis: 'Hypertension', medicines: [{ name: 'Med A', dosage: '1 tab' }], notes: 'Take daily' });

  console.log('Seed complete');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
