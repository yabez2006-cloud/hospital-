// In-memory store for when MongoDB is unavailable
let patients = [];
let doctors = [];
let appointments = [];
let feedbacks = [];
let nextPatientId = 1;
let nextDoctorId = 1;
let nextAppointmentId = 1;
let nextFeedbackId = 1;

module.exports = {
  patients: {
    find: () => Promise.resolve(patients),
    findById: (id) => Promise.resolve(patients.find((p) => p._id == id)),
    count: () => patients.length,
    create: (data) => {
      const patient = { _id: nextPatientId++, ...data };
      patients.push(patient);
      return Promise.resolve(patient);
    },
    findByIdAndUpdate: (id, data) => {
      const index = patients.findIndex((p) => p._id == id);
      if (index === -1) return Promise.resolve(null);
      patients[index] = { ...patients[index], ...data };
      return Promise.resolve(patients[index]);
    },
    findByIdAndDelete: (id) => {
      const index = patients.findIndex((p) => p._id == id);
      if (index === -1) return Promise.resolve(null);
      const deleted = patients.splice(index, 1)[0];
      return Promise.resolve(deleted);
    },
  },
  doctors: {
    find: () => Promise.resolve(doctors),
    findById: (id) => Promise.resolve(doctors.find((d) => d._id == id)),
    count: () => doctors.length,
    create: (data) => {
      const doctor = { _id: nextDoctorId++, ...data };
      doctors.push(doctor);
      return Promise.resolve(doctor);
    },
    findByIdAndUpdate: (id, data) => {
      const index = doctors.findIndex((d) => d._id == id);
      if (index === -1) return Promise.resolve(null);
      doctors[index] = { ...doctors[index], ...data };
      return Promise.resolve(doctors[index]);
    },
    findByIdAndDelete: (id) => {
      const index = doctors.findIndex((d) => d._id == id);
      if (index === -1) return Promise.resolve(null);
      const deleted = doctors.splice(index, 1)[0];
      return Promise.resolve(deleted);
    },
  },
  appointments: {
    find: () => Promise.resolve(appointments),
    findById: (id) => Promise.resolve(appointments.find((a) => a._id == id)),
    create: (data) => {
      const appointment = { _id: nextAppointmentId++, ...data };
      appointments.push(appointment);
      return Promise.resolve(appointment);
    },
    findByIdAndUpdate: (id, data) => {
      const index = appointments.findIndex((a) => a._id == id);
      if (index === -1) return Promise.resolve(null);
      appointments[index] = { ...appointments[index], ...data };
      return Promise.resolve(appointments[index]);
    },
    findByIdAndDelete: (id) => {
      const index = appointments.findIndex((a) => a._id == id);
      if (index === -1) return Promise.resolve(null);
      const deleted = appointments.splice(index, 1)[0];
      return Promise.resolve(deleted);
    },
    count: () => appointments.length,
  },
  feedbacks: {
    find: () => Promise.resolve(feedbacks),
    create: (data) => {
      const feedback = { _id: nextFeedbackId++, createdAt: new Date(), ...data };
      feedbacks.push(feedback);
      return Promise.resolve(feedback);
    },
    count: () => feedbacks.length,
  },
};
