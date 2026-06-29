const express = require("express");
const router = express.Router();
const MedicalReport = require("../models/MedicalReport");
const { upload, handleFileUpload } = require("../utils/upload");

// File upload endpoint (multipart/form-data) field name: "file"
router.post("/upload", upload.single("file"), async (req, res) => {
  return handleFileUpload(req, res);
});

// Download report: if stored in Cloudinary (reportFile is URL) redirect; if GridFS, stream by fileId
router.get("/download/:id", async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    if (report.reportFile && String(report.reportFile).startsWith("http")) {
      return res.redirect(report.reportFile);
    }

    // assume GridFS
    const mongoose = require("mongoose");
    const db = mongoose.connection.db;
    if (!db) return res.status(500).json({ error: "MongoDB not connected" });
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "reports" });
    const downloadStream = bucket.openDownloadStream(report.fileId);
    res.setHeader("Content-Disposition", `attachment; filename="${report.reportFile || 'report'}"`);
    downloadStream.pipe(res);
    downloadStream.on("error", (err) => res.status(500).json({ error: err.message }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create report metadata (file upload handled separately)
router.post("/", async (req, res) => {
  try {
    const r = new MedicalReport(req.body);
    await r.save();
    res.status(201).json(r);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get reports for a patient
router.get("/patient/:patientId", async (req, res) => {
  try {
    const reports = await MedicalReport.find({ patient: req.params.patientId }).sort({ uploadedAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
