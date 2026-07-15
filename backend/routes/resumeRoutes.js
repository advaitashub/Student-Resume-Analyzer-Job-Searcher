// resumeRoutes.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
const { uploadResume, getMyResume, chatWithAssistant } = require("../controllers/resumeController");
const { protect } = require("../middleware/authMiddleware");

// Setup Multer storage
const upload = multer({
  dest: "uploads/",
});

// Protected routes
router.post("/upload", protect, upload.single("resume"), uploadResume);
router.get("/my-resume", protect, getMyResume);
router.post("/chat", protect, chatWithAssistant);

module.exports = router;