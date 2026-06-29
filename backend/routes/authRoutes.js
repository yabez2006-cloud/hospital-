const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Patient = require("../models/Patient");
const memoryStore = require("../db/memoryStore");
const connectionState = require("../db/connectionState");
const { createAuthToken } = require("../middleware/auth");

function getUsersStore() {
  return connectionState.isMongoConnected ? User : memoryStore.users;
}

async function findUserByUsername(username) {
  const store = getUsersStore();
  return store.findOne({ username });
}

async function createUser(data) {
  const store = getUsersStore();
  if (connectionState.isMongoConnected) {
    const user = new User(data);
    return user.save();
  }

  return store.create(data);
}

async function createPatientProfile(data) {
  if (connectionState.isMongoConnected) {
    const patient = new Patient(data);
    return patient.save();
  }

  return memoryStore.patients.create(data);
}

async function ensureDefaultAdmin() {
  const existingAdmin = await findUserByUsername("admin123");
  if (existingAdmin) {
    return existingAdmin;
  }

  return createUser({ username: "admin123", password: "1234", role: "admin" });
}

function sendAuthResponse(res, user) {
  res.json({
    success: true,
    message: "Login Successful",
    token: createAuthToken(user),
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
    },
  });
}

async function handleRoleLogin(req, res, expectedRole) {
  const { username, password } = req.body;
  const usernameNotFoundMessage = { message: "Username not exists" };

  if (expectedRole === "admin" && username === "admin123") {
    if (password === "1234") {
      const admin = await ensureDefaultAdmin();
      return sendAuthResponse(res, admin);
    } else {
      return res.status(400).json({
        message: "Wrong password",
      });
    }
  }

  const user = await findUserByUsername(username);

  if (!user || user.role !== expectedRole) {
    return res.status(404).json(usernameNotFoundMessage);
  }

  if (user.password !== password) {
    return res.status(400).json({
      message: "Wrong password",
    });
  }

  return sendAuthResponse(res, user);
}

// Register
router.post("/register", async (req, res) => {
  const { username, password, name } = req.body;

  const existingUser = await findUserByUsername(username);

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const user = await createUser({
    username,
    password,
    role: "patient",
  });

  await createPatientProfile({
    username,
    name: name || username,
    age: 0,
    gender: "Unspecified",
    phone: "",
    user: user._id,
  });

  res.json({
    success: true,
    token: createAuthToken(user),
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
    },
  });
});

router.post("/admin-login", async (req, res) => handleRoleLogin(req, res, "admin"));
router.post("/doctor-login", async (req, res) => handleRoleLogin(req, res, "doctor"));
router.post("/patient-login", async (req, res) => handleRoleLogin(req, res, "patient"));
router.post("/login", async (req, res) => handleRoleLogin(req, res, "admin"));

module.exports = router;
