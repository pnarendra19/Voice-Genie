const mongoose = require("mongoose");

async function connectDB() {
  const uri = (process.env.MONGODB_URI || "").trim();
  if (!uri) {
    console.warn("MONGODB_URI is not set: conversation memory is disabled.");
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB connected (db: ${mongoose.connection.name})`);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }
}

module.exports = connectDB;