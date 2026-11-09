const path = require("path");
const fs = require("fs");

// Load server/.env by exact path, so it works no matter where you start the server from
const envPath = path.join(__dirname, ".env");
require("dotenv").config({ path: envPath, override: true });

// Temporary debug, remove once memory works
console.log(".env found:", fs.existsSync(envPath), "->", envPath);
console.log("MONGODB_URI loaded:", !!process.env.MONGODB_URI);

const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const chatRoute = require("./routes/chat");

const app = express();

// Allowed frontend address(es), comma separated. Set FRONTEND_URL when deployed.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", provider: process.env.AI_PROVIDER || "ollama" });
});

app.use("/api/chat", chatRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`VoiceGenie server running on http://localhost:${PORT}`);
  console.log(`AI provider: ${process.env.AI_PROVIDER || "ollama"}`);

  connectDB(); // MongoDB (conversation memory)

  // Preload the local model so the first reply isn't slow
  if ((process.env.AI_PROVIDER || "ollama") === "ollama") {
    require("./services/ollama").warmUp();
  }
});