const mongoose = require('mongoose');

// mongodb-memory-server can fail to spawn mongod on some Windows setups.
// Skip this integration test on Windows to keep the test suite runnable locally.
const isWindows = process.platform === 'win32';
const describeIf = isWindows ? describe.skip : describe;

let MongoMemoryServer;
if (!isWindows) {
  MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
}

const request = require('supertest');
const app = require('../server');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Availability = require('../models/Availability');
const Appointment = require('../models/Appointment');

let mongoServer;

beforeAll(async () => {
  if (isWindows) return;
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  if (isWindows) return;
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    Doctor.deleteMany(),
    Patient.deleteMany(),
    Availability.deleteMany(),
    Appointment.deleteMany(),
  ]);
});

describeIf('Appointment booking and approval flow', () => {
  test('patient requests slot and doctor approves', async () => {
    const dr = await Doctor.create({ name: 'Dr Test', username: 'drtest', specialization: 'General' });
    const pt = await Patient.create({ name: 'Pat Test', username: 'pattest' });

    const slotDate = new Date();
    const slot = await Availability.create({ doctor: dr._id, availableDate: slotDate, startTime: '09:00', endTime: '09:30' });

    // Simulate patient booking using auth tokens
    const agent = request(app);
    const { createAuthToken } = require('../middleware/auth');
    const patientToken = createAuthToken({ _id: pt._id, username: pt.username, role: 'patient' });
    const doctorToken = createAuthToken({ _id: dr._id, username: dr.username, role: 'doctor' });

    // Create appointment request
    const res = await agent
      .post('/api/appointments/book')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ doctor: dr._id.toString(), availableDate: slotDate.toISOString(), startTime: '09:00' });

    expect(res.status).toBe(201);
    const appointmentId = res.body._1 || res.body._id || res.body.id || res.body._id;
    // find appointment in DB
    const apptInDb = await Appointment.findOne({ patient: pt._id });
    expect(apptInDb.status).toBe('Pending');

    const slotAfter = await Availability.findById(slot._id);
    expect(slotAfter.status).toBe('Pending');

    // Approve as doctor
    const res2 = await agent.post(`/api/appointments/${apptInDb._id}/approve`).set('Authorization', `Bearer ${doctorToken}`).send();
    expect(res2.status).toBe(200);
    const apptAfter = await Appointment.findById(apptInDb._id);
    expect(apptAfter.status).toBe('Approved');

    const slotFinal = await Availability.findById(slot._id);
    expect(slotFinal.status).toBe('Unavailable');
  });
});

