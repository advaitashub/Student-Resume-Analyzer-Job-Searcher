// Job.js
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  skills: [
    {
      type: String,
      required: true,
    },
  ],
  description: {
    type: String,
    required: true,
    default: "Exciting opportunity to join our engineering team and build scalable products.",
  },
  location: {
    type: String,
    required: true,
    default: "Remote",
  },
  experienceLevel: {
    type: String,
    required: true,
    enum: ["Entry Level", "Intermediate", "Senior", "All Levels"],
    default: "Entry Level",
  },
  salary: {
    type: String,
    default: "Competitive",
  },
  type: {
    type: String,
    required: true,
    enum: ["Internship", "Full-time", "Part-time", "Contract"],
    default: "Internship",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Job", jobSchema);
