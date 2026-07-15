// jobController.js
const Job = require("../models/Job");

// GET ALL JOBS
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET JOB BY ID
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CREATE JOB (Admin only)
const createJob = async (req, res) => {
  try {
    const { title, company, skills, description, location, experienceLevel, salary, type } = req.body;

    if (!title || !company || !skills) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, company, and skills",
      });
    }

    // Split skill string if it comes as a comma-separated list
    let skillsArray = skills;
    if (typeof skills === "string") {
      skillsArray = skills.split(",").map((s) => s.trim().toLowerCase());
    } else if (Array.isArray(skills)) {
      skillsArray = skills.map((s) => s.toLowerCase());
    }

    const job = await Job.create({
      title,
      company,
      skills: skillsArray,
      description,
      location,
      experienceLevel,
      salary,
      type,
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE JOB (Admin only)
const updateJob = async (req, res) => {
  try {
    const { title, company, skills, description, location, experienceLevel, salary, type } = req.body;

    let job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Prepare updates
    let updates = { title, company, description, location, experienceLevel, salary, type };

    if (skills) {
      if (typeof skills === "string") {
        updates.skills = skills.split(",").map((s) => s.trim().toLowerCase());
      } else if (Array.isArray(skills)) {
        updates.skills = skills.map((s) => s.toLowerCase());
      }
    }

    // Clean undefined fields
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    job = await Job.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE JOB (Admin only)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
};
