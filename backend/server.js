require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const medicalReportRoutes = require("./routes/medicalReportRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const visitRoutes = require("./routes/visitRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/reports", medicalReportRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/visits", visitRoutes);

// MongoDB Connection will be established when running the server directly

// Test Route
app.get("/", (req, res) => {
  res.send("Hospital Management API Running");
});

// Start Server
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test" && require.main === module) {
  // Connect to MongoDB then start
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      const connectionState = require("./db/connectionState");
      connectionState.isMongoConnected = true;
      console.log("✅ MongoDB Connected Successfully");

      // create http server and socket.io
      const http = require('http');
      const server = http.createServer(app);
      const { Server } = require('socket.io');
      const io = new Server(server, { cors: { origin: '*' } });
      const notify = require('./utils/notify');
      notify.setIO(io);

      io.on('connection', (socket) => {
        // client should join a room equal to their user id
        socket.on('join', (room) => { if (room) socket.join(String(room)); });
      });

      server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      const connectionState = require("./db/connectionState");
      connectionState.isMongoConnected = false;
      console.error("❌ MongoDB Connection Error:");
      console.error(err);
      // still start server (in memory mode without sockets)
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} (no DB)`);
      });
    });
}

module.exports = app;