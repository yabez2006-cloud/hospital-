require("dotenv").config();
const mongoose = require("mongoose");

console.log("MONGO_URI loaded:", !!process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err);
    process.exit(1);
  });