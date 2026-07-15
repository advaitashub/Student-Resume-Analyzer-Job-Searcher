// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load Environment Variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const resumeRoutes = require("./routes/resumeRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Serving uploaded files static directory if needed
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resume", resumeRoutes);

// Root Endpoint
app.get("/", (req, res) => {
  res.send("Resume Analyzer Backend Running");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server!",
    error: err.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});