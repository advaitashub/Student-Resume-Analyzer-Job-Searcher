// Resume.js
const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  parsedText: {
    type: String,
    required: true,
  },
  skills: [
    {
      type: String,
    },
  ],
  uploadedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Resume", resumeSchema);
