const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const user = await User.create({
    username,
    password,
  });

  res.json({
    success: true,
    user,
  });
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(404).json({
      message: "User not registered. Please register first.",
    });
  }

  if (user.password !== password) {
    return res.status(400).json({
      message: "Enter correct password",
    });
  }

  res.json({
    success: true,
    message: "Login Successful",
  });
});

module.exports = router;
