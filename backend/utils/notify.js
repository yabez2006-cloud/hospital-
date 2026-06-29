const nodemailer = require('nodemailer');
let io = null;

function setIO(serverIO) {
  io = serverIO;
}

async function sendEmail(to, subject, text) {
  if (!process.env.SMTP_HOST) return; // skip if not configured
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporter.sendMail({ from: process.env.SMTP_FROM || 'noreply@hospital.local', to, subject, text });
}

function emitToUser(userId, payload) {
  try {
    if (io && userId) {
      io.to(String(userId)).emit('notification', payload);
    }
  } catch (e) {
    console.warn('emitToUser error', e.message);
  }
}

async function notifyAppointmentRequested(doctorId, patient, appointment) {
  const msg = `${patient.name || patient.username} requested an appointment on ${new Date(appointment.date).toLocaleString()}`;
  emitToUser(doctorId, { type: 'appointment_requested', message: msg, appointment });
  // optionally email doctors: assume doctor user has email equal to username@localhost
  await sendEmail(`${doctorId}@example.invalid`, 'Appointment Requested', msg).catch(()=>{});
}

async function notifyAppointmentStatusToPatient(patientId, appointment, status) {
  const msg = `Your appointment on ${new Date(appointment.date).toLocaleString()} is ${status}`;
  emitToUser(patientId, { type: 'appointment_status', status, message: msg, appointment });
  await sendEmail(`${patientId}@example.invalid`, `Appointment ${status}`, msg).catch(()=>{});
}

module.exports = { setIO, sendEmail, emitToUser, notifyAppointmentRequested, notifyAppointmentStatusToPatient };
