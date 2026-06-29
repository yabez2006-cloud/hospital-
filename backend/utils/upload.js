const multer = require("multer");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const MedicalReport = require("../models/MedicalReport");

const storage = multer.memoryStorage();
const upload = multer({ storage });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function handleFileUpload(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const file = req.file;
    const storageMode = (process.env.REPORT_STORAGE || "gridfs").toLowerCase();

    if (storageMode === "cloudinary") {
      // upload to Cloudinary using upload_stream
      const streamUpload = (buffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ resource_type: "auto", folder: process.env.CLOUDINARY_FOLDER || "medical_reports" }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });
          streamifier.createReadStream(buffer).pipe(stream);
        });

      const result = await streamUpload(file.buffer);
      const report = new MedicalReport({
        patient: req.body.patient,
        doctor: req.body.doctor,
        reportType: req.body.reportType || file.mimetype,
        reportFile: result.secure_url,
        fileId: result.public_id,
      });
      await report.save();
      return res.status(201).json(report);
    }

    // Default: gridfs
    const db = mongoose.connection.db;
    if (!db) return res.status(500).json({ error: "MongoDB not connected" });

    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "reports" });
    const uploadStream = bucket.openUploadStream(file.originalname, { contentType: file.mimetype });
    uploadStream.end(file.buffer);

    uploadStream.on("finish", async (uploaded) => {
      const report = new MedicalReport({
        patient: req.body.patient,
        doctor: req.body.doctor,
        reportType: req.body.reportType || file.mimetype,
        reportFile: file.originalname,
        fileId: uploaded._id,
      });
      await report.save();
      res.status(201).json(report);
    });

    uploadStream.on("error", (err) => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { upload, handleFileUpload };
