// seeds.js
require("dotenv").config();
const mongoose = require("mongoose");
const Job = require("./models/Job");
const Internship = require("./models/Internship");

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB Connected for seeding...");

    // Clean up old collections
    await Job.deleteMany({});
    await Internship.deleteMany({}); // Delete old internships collection just in case

    const seedJobs = [
      {
        title: "Frontend Engineer Intern",
        company: "Google",
        skills: ["html", "css", "javascript", "react", "tailwind css", "figma"],
        description: "Join the Google UX team to build highly responsive, user-friendly, and modern web applications. You will collaborate with designers and backend engineers to craft premium user experiences.",
        location: "Mountain View, CA (Hybrid)",
        experienceLevel: "Entry Level",
        salary: "$45 - $60 / hour",
        type: "Internship"
      },
      {
        title: "Backend Developer Intern",
        company: "Amazon",
        skills: ["node.js", "express.js", "mongodb", "sql", "rest api", "git"],
        description: "We are seeking a talented Backend Software Intern to build reliable and secure cloud endpoints, manage data schemas, and optimize database operations for our e-commerce platforms.",
        location: "Seattle, WA (Remote)",
        experienceLevel: "Entry Level",
        salary: "$40 - $55 / hour",
        type: "Internship"
      },
      {
        title: "Machine Learning Engineer",
        company: "Microsoft",
        skills: ["python", "tensorflow", "pytorch", "numpy", "pandas", "scikit-learn", "problem solving"],
        description: "Contribute to cutting-edge AI innovations in Microsoft Azure. You will train high-performance neural networks, evaluate semantic matching engines, and build robust pipelines for large language models.",
        location: "Redmond, WA (On-site)",
        experienceLevel: "Intermediate",
        salary: "$120,000 - $155,000 / year",
        type: "Full-time"
      },
      {
        title: "Full-stack Developer",
        company: "Netflix",
        skills: ["react", "node.js", "express.js", "mongodb", "javascript", "typescript", "tailwind css", "aws"],
        description: "Netflix streaming infrastructure is scaling! As a Full-Stack Engineer, you will build administrative dashboards and media streaming portals using React, Express, MongoDB, and AWS cloud tools.",
        location: "Los Gatos, CA (Hybrid)",
        experienceLevel: "Intermediate",
        salary: "$130,000 - $170,000 / year",
        type: "Full-time"
      },
      {
        title: "Cloud & DevOps Intern",
        company: "Meta",
        skills: ["docker", "kubernetes", "aws", "git", "ci/cd", "linux", "teamwork"],
        description: "Gain hands-on experience managing infrastructure-as-code and automating deployments for millions of users on Facebook and Instagram. You'll build CI/CD pipelines, package apps into Docker containers, and deploy on AWS.",
        location: "Menlo Park, CA (Hybrid)",
        experienceLevel: "Entry Level",
        salary: "$48 - $65 / hour",
        type: "Internship"
      },
      {
        title: "Junior Data Analyst",
        company: "Spotify",
        skills: ["python", "sql", "numpy", "pandas", "communication", "problem solving"],
        description: "Analyze music streaming metrics and help curate personalized playlists. You will query databases using SQL, clean data with Pandas, and present data-driven recommendations to the marketing team.",
        location: "New York, NY (Remote)",
        experienceLevel: "Entry Level",
        salary: "$85,000 - $110,000 / year",
        type: "Full-time"
      }
    ];

    // Seed into our Job collection
    await Job.insertMany(seedJobs);
    console.log("Premium jobs successfully seeded!");

    // Seed a copy of a few items into Internship for full backwards compatibility
    await Internship.insertMany([
      {
        title: "Frontend Intern",
        company: "Google",
        skills: ["html", "css", "javascript", "react"],
      },
      {
        title: "Backend Intern",
        company: "Amazon",
        skills: ["node", "express", "mongodb"],
      },
      {
        title: "ML Intern",
        company: "Microsoft",
        skills: ["python", "tensorflow", "numpy"],
      }
    ]);
    console.log("Backwards compatible internships successfully seeded!");

    console.log("Database Seeding Completed.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedData();