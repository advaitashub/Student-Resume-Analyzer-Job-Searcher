// jobRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.route("/")
  .get(getAllJobs)
  .post(protect, adminOnly, createJob);

router.route("/:id")
  .get(getJobById)
  .put(protect, adminOnly, updateJob)
  .delete(protect, adminOnly, deleteJob);

module.exports = router;
