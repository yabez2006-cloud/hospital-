const express = require("express");
const Feedback = require("../models/Feedback");
const memoryStore = require("../db/memoryStore");
const connectionState = require("../db/connectionState");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, requireRole("admin"), async (req, res) => {
  try {
    let feedbacks;
    if (connectionState.isMongoConnected) {
      feedbacks = await Feedback.find().sort({ createdAt: -1 }).maxTimeMS(5000);
    } else {
      feedbacks = await memoryStore.feedbacks.find();
    }
    res.json(feedbacks);
  } catch (error) {
    const feedbacks = await memoryStore.feedbacks.find();
    res.json(feedbacks);
    connectionState.isMongoConnected = false;
  }
});

router.post("/", authenticate, requireRole("patient"), async (req, res) => {
  try {
    let feedback;
    if (connectionState.isMongoConnected) {
      feedback = await Feedback.create(req.body);
    } else {
      feedback = await memoryStore.feedbacks.create(req.body);
    }
    res.status(201).json(feedback);
  } catch (error) {
    const feedback = await memoryStore.feedbacks.create(req.body);
    res.status(201).json(feedback);
    connectionState.isMongoConnected = false;
  }
});

module.exports = router;