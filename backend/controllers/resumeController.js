// resumeController.js
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const axios = require("axios");
const Resume = require("../models/Resume");
const Job = require("../models/Job");
const roadmaps = require("../utils/roadmaps");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

// Helper to generate dynamic timeline roadmaps for any skill
const getDynamicRoadmap = (skillName) => {
  const normalized = skillName.toLowerCase();
  
  // Return predefined roadmap if exists
  if (roadmaps[normalized]) {
    return roadmaps[normalized];
  }
  
  // Otherwise generate an intelligent structured roadmap
  const capitalized = skillName.charAt(0).toUpperCase() + skillName.slice(1);
  return [
    `Learn ${capitalized} core syntax, configuration, and fundamental workflows (Estimated: 5 days)`,
    `Explore intermediate topics, key libraries, and common design patterns in ${capitalized} (Estimated: 7 days)`,
    `Build an open-source, hands-on portfolio project integrating ${capitalized} (Estimated: 10 days)`,
    `Review official documentation, community forums, and free YouTube/freeCodeCamp certification courses (Estimated: 3 days)`
  ];
};

// UPLOAD & PARSE RESUME (PDF/DOCX)
const uploadResume = async (req, res) => {
  try {
    console.log("========== RESUME UPLOAD REQUEST ==========");
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const extension = path.extname(originalName).toLowerCase();
    
    let parsedText = "";

    console.log(`Parsing file: ${originalName} (Type: ${extension})`);

    if (extension === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      parsedText = pdfData.text;
    } else if (extension === ".docx") {
      const docxResult = await mammoth.extractRawText({ path: filePath });
      parsedText = docxResult.value;
    } else {
      // Fallback for plain text files
      parsedText = fs.readFileSync(filePath, "utf-8");
    }

    if (!parsedText || parsedText.trim().length === 0) {
      // Delete temporary file
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: "Failed to extract text from the uploaded file.",
      });
    }

    // Clean text slightly
    const cleanedText = parsedText
      .replace(/\s+/g, " ")
      .trim();

    console.log("Sending text to Python AI Service for skill extraction...");
    
    let extractedSkills = [];
    try {
      const extractResponse = await axios.post(`${AI_SERVICE_URL}/api/extract-skills`, {
        text: cleanedText
      });
      extractedSkills = extractResponse.data.skills;
    } catch (aiError) {
      console.warn("Python AI Service unavailable for skill extraction, falling back to local extractor...");
      // Fallback local keyword matching
      const localExtractor = require("../utils/skillExtractor");
      extractedSkills = localExtractor(cleanedText.toLowerCase());
    }

    console.log("Extracted Skills:", extractedSkills);

    // Save or update Resume in MongoDB
    let resume = await Resume.findOne({ user: req.user._id });
    if (resume) {
      // Delete old file on disk if exists
      if (fs.existsSync(resume.filePath) && resume.filePath !== filePath) {
        try { fs.unlinkSync(resume.filePath); } catch (e) { console.error(e); }
      }
      resume.fileName = originalName;
      resume.filePath = filePath;
      resume.parsedText = cleanedText;
      resume.skills = extractedSkills;
      await resume.save();
    } else {
      resume = await Resume.create({
        user: req.user._id,
        fileName: originalName,
        filePath: filePath,
        parsedText: cleanedText,
        skills: extractedSkills,
      });
    }

    // Fetch all jobs for semantic matching
    console.log("Fetching jobs from database...");
    const jobs = await Job.find();
    
    let semanticMatches = [];
    
    if (jobs.length > 0) {
      console.log(`Sending resume and ${jobs.length} jobs to Python AI Service for semantic matching...`);
      try {
        const matchResponse = await axios.post(`${AI_SERVICE_URL}/api/semantic-match`, {
          resume_text: cleanedText,
          resume_skills: extractedSkills,
          jobs: jobs.map(j => ({
            id: j._id.toString(),
            title: j.title,
            company: j.company,
            skills: j.skills,
            description: j.description
          }))
        });
        
        // Populate match data with personalized learning roadmaps
        semanticMatches = matchResponse.data.matches.map(match => {
          return {
            ...match,
            learningRoadmaps: match.missingSkills.map(skill => ({
              skill,
              roadmap: getDynamicRoadmap(skill)
            }))
          };
        });
      } catch (matchError) {
        console.error("Failed to run semantic matching from Python Service, falling back to keyword logic...", matchError.message);
        
        // Fallback exact keyword matching
        semanticMatches = jobs.map((job) => {
          const matchedSkills = job.skills.filter((skill) =>
            extractedSkills.some(s => {
              const sLow = s.toLowerCase();
              const jLow = skill.toLowerCase();
              return sLow === jLow || sLow.includes(jLow) || jLow.includes(sLow);
            })
          );
          const missingSkills = job.skills.filter((skill) =>
            !extractedSkills.some(s => {
              const sLow = s.toLowerCase();
              const jLow = skill.toLowerCase();
              return sLow === jLow || sLow.includes(jLow) || jLow.includes(sLow);
            })
          );
          const score = job.skills.length > 0 ? (matchedSkills.length / job.skills.length) * 100 : 0;
          
          return {
            title: job.title,
            company: job.company,
            matchPercentage: Math.round(score * 100) / 100,
            matchedSkills,
            missingSkills,
            whyMatched: `Keyword Match: You possess ${matchedSkills.length} out of ${job.skills.length} required keywords.`,
            learningRoadmaps: missingSkills.map(skill => ({
              skill,
              roadmap: getDynamicRoadmap(skill)
            }))
          };
        }).sort((a, b) => b.matchPercentage - a.matchPercentage);
      }
    }

    res.json({
      success: true,
      message: "Resume processed and matched successfully!",
      resume: {
        fileName: resume.fileName,
        skills: resume.skills,
        uploadedAt: resume.uploadedAt
      },
      matches: semanticMatches
    });

  } catch (error) {
    console.error("Error in uploadResume:", error);
    res.status(500).json({
      success: false,
      message: "Error processing resume",
      error: error.message,
    });
  }
};

// FETCH USER'S RESUME & MATCH DATA (For loading on reload)
const getMyResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id });
    if (!resume) {
      return res.json({
        success: true,
        resume: null,
        matches: []
      });
    }

    // Recalculate semantic matching dynamically in case jobs changed
    const jobs = await Job.find();
    let semanticMatches = [];

    if (jobs.length > 0) {
      try {
        const matchResponse = await axios.post(`${AI_SERVICE_URL}/api/semantic-match`, {
          resume_text: resume.parsedText,
          resume_skills: resume.skills,
          jobs: jobs.map(j => ({
            id: j._id.toString(),
            title: j.title,
            company: j.company,
            skills: j.skills,
            description: j.description
          }))
        });

        semanticMatches = matchResponse.data.matches.map(match => ({
          ...match,
          learningRoadmaps: match.missingSkills.map(skill => ({
            skill,
            roadmap: getDynamicRoadmap(skill)
          }))
        }));
      } catch (matchError) {
        console.warn("Python AI Service offline during getMyResume, using local keyword fallback...");
        semanticMatches = jobs.map((job) => {
          const matchedSkills = job.skills.filter((skill) =>
            resume.skills.some(s => {
              const sLow = s.toLowerCase();
              const jLow = skill.toLowerCase();
              return sLow === jLow || sLow.includes(jLow) || jLow.includes(sLow);
            })
          );
          const missingSkills = job.skills.filter((skill) =>
            !resume.skills.some(s => {
              const sLow = s.toLowerCase();
              const jLow = skill.toLowerCase();
              return sLow === jLow || sLow.includes(jLow) || jLow.includes(sLow);
            })
          );
          const score = job.skills.length > 0 ? (matchedSkills.length / job.skills.length) * 100 : 0;

          return {
            title: job.title,
            company: job.company,
            matchPercentage: Math.round(score * 100) / 100,
            matchedSkills,
            missingSkills,
            whyMatched: `Keyword Match: You possess ${matchedSkills.length} out of ${job.skills.length} required keywords.`,
            learningRoadmaps: missingSkills.map(skill => ({
              skill,
              roadmap: getDynamicRoadmap(skill)
            }))
          };
        }).sort((a, b) => b.matchPercentage - a.matchPercentage);
      }
    }

    res.json({
      success: true,
      resume: {
        fileName: resume.fileName,
        skills: resume.skills,
        uploadedAt: resume.uploadedAt
      },
      matches: semanticMatches
    });

  } catch (error) {
    console.error("Error in getMyResume:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching resume data",
      error: error.message
    });
  }
};

// CHAT WITH AI CAREER ASSISTANT
const chatWithAssistant = async (req, res) => {
  try {
    const { message, currentJobTitle, missingSkills } = req.body;
    
    // Find user's resume
    const resume = await Resume.findOne({ user: req.user._id });
    const userSkills = resume ? resume.skills : [];
    
    console.log(`Communicating with Python AI Chatbot for message: "${message}"`);
    
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/chat-assistant`, {
        message,
        user_skills: userSkills,
        current_job_title: currentJobTitle || null,
        missing_skills: missingSkills || []
      });
      
      res.json({
        success: true,
        reply: response.data.reply
      });
    } catch (aiError) {
      console.error("FastAPI Chatbot offline. Generating local keyword reply...");
      // Fallback local intelligent router if Python service is down
      let reply = "I'm currently running in local offline mode. How can I assist you with your career goals today?";
      const msg = message.toLowerCase();
      
      if (msg.includes("tips") || msg.includes("resume")) {
        reply = "Offline Resume tips:\n1. Quantify achievements (e.g. 'boosted performance by 25%').\n2. Put your technical stack in a distinct, readable block.\n3. Customize your description to match job posts.";
      } else if (msg.includes("skills") || msg.includes("gap") || msg.includes("learn")) {
        reply = `You have these skills in MongoDB: **${userSkills.join(", ") || "none uploaded"}**. Focus on learning modern full-stack tools (React, Express, AWS, Docker) to broaden your portfolio!`;
      }
      
      res.json({
        success: true,
        reply
      });
    }
  } catch (error) {
    console.error("Error in chatWithAssistant:", error);
    res.status(500).json({
      success: false,
      message: "Error communicating with AI Assistant",
      error: error.message
    });
  }
};

module.exports = {
  uploadResume,
  getMyResume,
  chatWithAssistant,
};