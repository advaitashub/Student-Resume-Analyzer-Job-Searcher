// app.js
const API_BASE = "http://127.0.0.1:5000/api";

// App State
const state = {
  user: null,
  token: null,
  activeSection: "landing",
  activeDashboardTab: "overview",
  resume: null,
  matches: [],
  jobs: [], // for admin dashboard
  chatHistory: []
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  console.log("TalentLens AI initialized.");
  
  // Load token & user session from LocalStorage
  state.token = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    state.user = JSON.parse(savedUser);
  }

  // Setup theme
  initTheme();

  // Initial routing
  if (state.token && state.user) {
    updateAuthUI();
    fetchUserResumeData();
    navigateTo("dashboard");
  } else {
    navigateTo("landing");
  }

  // Initialize Lucide icons
  lucide.createIcons();

  // Setup Resume Dropzone Listeners
  setupResumeDropzone();
});

// Theme Management
function initTheme() {
  const currentTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  if (currentTheme === "dark") {
    document.documentElement.classList.add("dark");
    document.getElementById("theme-icon-sun").classList.add("hidden");
    document.getElementById("theme-icon-moon").classList.remove("hidden");
  } else {
    document.documentElement.classList.remove("dark");
    document.getElementById("theme-icon-sun").classList.remove("hidden");
    document.getElementById("theme-icon-moon").classList.add("hidden");
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  
  if (newTheme === "dark") {
    document.documentElement.classList.add("dark");
    document.getElementById("theme-icon-sun").classList.add("hidden");
    document.getElementById("theme-icon-moon").classList.remove("hidden");
  } else {
    document.documentElement.classList.remove("dark");
    document.getElementById("theme-icon-sun").classList.remove("hidden");
    document.getElementById("theme-icon-moon").classList.add("hidden");
  }
}

// Navigation (SPA Router)
function navigateTo(sectionId) {
  console.log(`Navigating to section: ${sectionId}`);
  
  // Guard protected sections
  if ((sectionId === "dashboard" || sectionId === "admin") && (!state.token || !state.user)) {
    navigateTo("auth");
    return;
  }
  
  if (sectionId === "admin" && state.user?.role !== "admin") {
    navigateTo("dashboard");
    return;
  }

  // Hide all sections
  document.getElementById("section-landing").classList.add("hidden");
  document.getElementById("section-auth").classList.add("hidden");
  document.getElementById("section-dashboard").classList.add("hidden");
  document.getElementById("section-admin").classList.add("hidden");

  // Show target section
  const targetSection = document.getElementById(`section-${sectionId}`);
  if (targetSection) {
    targetSection.classList.remove("hidden");
    state.activeSection = sectionId;
  }

  // Update active nav links
  if (sectionId === "dashboard") {
    switchDashboardTab(state.activeDashboardTab);
  } else if (sectionId === "admin") {
    loadAdminJobs();
  }
  
  window.scrollTo({ top: 0, behavior: "smooth" });
  lucide.createIcons();
}

// Dashboard Tabs Switcher
function switchDashboardTab(tabId) {
  console.log(`Switching dashboard tab to: ${tabId}`);
  state.activeDashboardTab = tabId;

  // Deactivate all tab buttons
  document.querySelectorAll(".sidebar-link").forEach(btn => {
    btn.classList.remove("active");
  });

  // Activate matching tab button
  const activeBtn = document.getElementById(`db-tab-${tabId}-btn`);
  if (activeBtn) activeBtn.classList.add("active");

  // Hide all sub-views
  document.querySelectorAll(".dashboard-view").forEach(view => {
    view.classList.add("hidden");
  });

  // Show target sub-view
  const targetView = document.getElementById(`db-view-${tabId}`);
  if (targetView) targetView.classList.remove("hidden");

  // Custom renders for specific tabs
  if (tabId === "overview") {
    renderOverview();
  } else if (tabId === "matches") {
    renderMatchesList();
  } else if (tabId === "gap") {
    populateGapJobSelector();
  } else if (tabId === "roadmaps") {
    populateRoadmapSkillSelector();
  }

  lucide.createIcons();
}

// Switching Auth Tabs (Login vs Register)
function switchAuthTab(type) {
  const alertBox = document.getElementById("auth-alert");
  if (alertBox) alertBox.classList.add("hidden");

  if (type === "login") {
    document.getElementById("tab-login-btn").className = "w-1/2 pb-3 font-semibold text-center border-b-2 border-indigo-500 text-indigo-400 transition-all";
    document.getElementById("tab-register-btn").className = "w-1/2 pb-3 font-semibold text-center border-b-2 border-transparent text-muted hover:text-main transition-all";
    document.getElementById("form-login").classList.remove("hidden");
    document.getElementById("form-register").classList.add("hidden");
  } else {
    document.getElementById("tab-login-btn").className = "w-1/2 pb-3 font-semibold text-center border-b-2 border-transparent text-muted hover:text-main transition-all";
    document.getElementById("tab-register-btn").className = "w-1/2 pb-3 font-semibold text-center border-b-2 border-indigo-500 text-indigo-400 transition-all";
    document.getElementById("form-login").classList.add("hidden");
    document.getElementById("form-register").classList.remove("hidden");
  }
}

// Authentication Logic
async function submitLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  
  showAuthAlert("Authenticating...", "indigo");

  try {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    
    if (res.data.success) {
      saveSession(res.data.token, res.data.user);
      showAuthAlert("Login Successful! Redirecting...", "emerald");
      
      setTimeout(() => {
        navigateTo("dashboard");
      }, 1000);
    }
  } catch (error) {
    showAuthAlert(error.response?.data?.message || "Invalid credentials", "danger");
  }
}

async function submitRegister(e) {
  e.preventDefault();
  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const role = document.getElementById("register-role").value;

  showAuthAlert("Creating Account...", "indigo");

  try {
    const res = await axios.post(`${API_BASE}/auth/register`, { name, email, password, role });
    
    if (res.data.success) {
      saveSession(res.data.token, res.data.user);
      showAuthAlert("Account Created successfully!", "emerald");
      
      setTimeout(() => {
        navigateTo("dashboard");
      }, 1000);
    }
  } catch (error) {
    showAuthAlert(error.response?.data?.message || "Registration failed", "danger");
  }
}

function saveSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  updateAuthUI();
  fetchUserResumeData();
}

function handleAuthAction() {
  if (state.token && state.user) {
    // Logout
    state.token = null;
    state.user = null;
    state.resume = null;
    state.matches = [];
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    updateAuthUI();
    navigateTo("landing");
  } else {
    navigateTo("auth");
  }
}

function updateAuthUI() {
  const btn = document.getElementById("auth-action-btn");
  const navDashboard = document.getElementById("nav-dashboard");
  const navAdmin = document.getElementById("nav-admin");
  
  if (state.token && state.user) {
    btn.innerHTML = `<i data-lucide="log-out" class="w-4 h-4"></i><span>Logout</span>`;
    btn.className = "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-main shadow transition-all";
    navDashboard.classList.remove("hidden");
    
    if (state.user.role === "admin") {
      navAdmin.classList.remove("hidden");
    } else {
      navAdmin.classList.add("hidden");
    }
    
    document.getElementById("user-display-name").textContent = state.user.name;
    document.getElementById("user-display-role").textContent = state.user.role === "admin" ? "Administrator" : "Student";
  } else {
    btn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i><span>Login / Sign Up</span>`;
    btn.className = "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all";
    navDashboard.classList.add("hidden");
    navAdmin.classList.add("hidden");
  }
  lucide.createIcons();
}

function showAuthAlert(msg, type) {
  const alertBox = document.getElementById("auth-alert");
  const msgSpan = document.getElementById("auth-alert-msg");
  
  alertBox.classList.remove("hidden", "bg-indigo-500/10", "border-indigo-500/20", "text-indigo-400", "bg-emerald-500/10", "border-emerald-500/20", "text-emerald-400", "bg-danger/10", "border-danger/20", "text-danger");
  
  if (type === "indigo") {
    alertBox.classList.add("bg-indigo-500/10", "border-indigo-500/20", "text-indigo-400");
  } else if (type === "emerald") {
    alertBox.classList.add("bg-emerald-500/10", "border-emerald-500/20", "text-emerald-400");
  } else {
    alertBox.classList.add("bg-danger/10", "border-danger/20", "text-danger");
  }
  
  msgSpan.textContent = msg;
}

// Fetch user previously parsed resume data
async function fetchUserResumeData() {
  if (!state.token) return;
  try {
    const res = await axios.get(`${API_BASE}/resume/my-resume`, {
      headers: { Authorization: `Bearer ${state.token}` }
    });
    
    if (res.data.success) {
      state.resume = res.data.resume;
      state.matches = res.data.matches;
      renderOverview();
      renderUploadedResumeView();
    }
  } catch (error) {
    console.error("Error loading user resume data:", error);
  }
}

// Resume Drag & Drop Setup
function setupResumeDropzone() {
  const dropzone = document.getElementById("resume-dropzone");
  const input = document.getElementById("resume-file-input");

  if (!dropzone) return;

  // Trigger input click
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("border-indigo-500", "bg-indigo-500/[0.04]");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("border-indigo-500", "bg-indigo-500/[0.04]");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("border-indigo-500", "bg-indigo-500/[0.04]");
    if (e.dataTransfer.files.length > 0) {
      handleResumeUpload(e.dataTransfer.files[0]);
    }
  });

  input.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleResumeUpload(e.target.files[0]);
    }
  });
}

// Multipart Upload handling
async function handleResumeUpload(file) {
  const allowed = [".pdf", ".docx"];
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  
  if (!allowed.includes(ext)) {
    alert("Unsupported file type. Please upload a PDF or DOCX file.");
    return;
  }

  const formData = new FormData();
  formData.append("resume", file);

  // Show progress bar container
  const progressPanel = document.getElementById("upload-status-panel");
  const progressBar = document.getElementById("upload-status-bar");
  const statusPercent = document.getElementById("upload-status-percent");
  const statusTitle = document.getElementById("upload-status-title");

  progressPanel.classList.remove("hidden");
  progressBar.style.width = "0%";
  statusPercent.textContent = "0%";
  statusTitle.textContent = "Uploading Resume file...";

  try {
    const res = await axios.post(`${API_BASE}/resume/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${state.token}`
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        progressBar.style.width = `${percentCompleted}%`;
        statusPercent.textContent = `${percentCompleted}%`;
        if (percentCompleted === 100) {
          statusTitle.textContent = "AI NLP Model parsing and matching... (Please wait)";
        }
      }
    });

    if (res.data.success) {
      state.resume = res.data.resume;
      state.matches = res.data.matches;
      
      statusTitle.textContent = "Success! Core skills mapped.";
      
      // Update UI components
      renderOverview();
      renderUploadedResumeView();
      
      setTimeout(() => {
        progressPanel.classList.add("hidden");
        // Navigate automatically to Job Recommendations to wow them
        switchDashboardTab("matches");
      }, 1200);
    }
  } catch (error) {
    statusTitle.textContent = "Parsing Error.";
    progressBar.classList.add("bg-danger");
    alert(error.response?.data?.message || "An error occurred during resume analysis.");
    setTimeout(() => {
      progressPanel.classList.add("hidden");
      progressBar.classList.remove("bg-danger");
    }, 4000);
  }
}

// Render Overview components
function renderOverview() {
  // Update available jobs count immediately
  axios.get(`${API_BASE}/jobs`).then(res => {
    if (res.data.success) {
      document.getElementById("overview-jobs-count").textContent = res.data.count;
    }
  }).catch(e => console.error(e));

  if (!state.resume) {
    document.getElementById("circular-score-ring").style.strokeDashoffset = "314.16";
    document.getElementById("overview-score-percent").textContent = "0%";
    document.getElementById("overview-score-desc").textContent = "No resume uploaded yet";
    document.getElementById("overview-skills-count").textContent = "0";
    document.getElementById("overview-skills-desc").textContent = "Extracted profile is empty";
    document.getElementById("overview-skills-container").innerHTML = `<div class="text-muted text-sm py-4 italic">No skills extracted yet. Upload your resume in the 'Resume Analyzer' tab to begin.</div>`;
    document.getElementById("overview-matches-container").innerHTML = `<div class="text-muted text-sm py-4 italic">Upload your resume to see matching recommendations.</div>`;
    return;
  }

  // Update extracted skills count
  const skillCount = state.resume.skills?.length || 0;
  document.getElementById("overview-skills-count").textContent = skillCount;
  document.getElementById("overview-skills-desc").textContent = `${skillCount} skills recognized via spaCy`;

  // Render match score (Top match percentage or average)
  const topMatch = state.matches.length > 0 ? state.matches[0].matchPercentage : 0;
  document.getElementById("overview-score-percent").textContent = `${Math.round(topMatch)}%`;
  
  // Animate Circular progress ring
  const circle = document.getElementById("circular-score-ring");
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI; // 314.16
  const offset = circumference - (topMatch / 100) * circumference;
  circle.style.strokeDashoffset = offset;

  if (topMatch >= 80) {
    document.getElementById("overview-score-desc").textContent = "Excellent compatibility found!";
    document.getElementById("overview-score-desc").className = "text-xs text-emerald-400 mt-4 font-semibold";
  } else if (topMatch >= 50) {
    document.getElementById("overview-score-desc").textContent = "Solid match. Bridging recommended.";
    document.getElementById("overview-score-desc").className = "text-xs text-amber-400 mt-4 font-semibold";
  } else {
    document.getElementById("overview-score-desc").textContent = "Low match index. Review gap areas.";
    document.getElementById("overview-score-desc").className = "text-xs text-danger mt-4 font-semibold";
  }

  // Render skills list chips
  document.getElementById("skills-badge-count").textContent = `${skillCount} Skills`;
  const container = document.getElementById("overview-skills-container");
  container.innerHTML = "";
  
  if (state.resume.skills && state.resume.skills.length > 0) {
    state.resume.skills.forEach(skill => {
      const chip = document.createElement("span");
      chip.className = "px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold shadow-sm";
      chip.textContent = skill;
      container.appendChild(chip);
    });
  }

  // Render top matches summary list
  const matchSummaryContainer = document.getElementById("overview-matches-container");
  matchSummaryContainer.innerHTML = "";

  if (state.matches && state.matches.length > 0) {
    state.matches.slice(0, 3).forEach(match => {
      let badgeClass = "bg-danger/10 border-danger/20 text-danger";
      if (match.matchPercentage >= 80) badgeClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      else if (match.matchPercentage >= 50) badgeClass = "bg-amber-500/10 border-amber-500/20 text-amber-400";

      const item = document.createElement("div");
      item.className = "flex items-center justify-between p-3 border border-white/5 bg-white/[0.01] rounded-xl hover:bg-white/5 transition-all cursor-pointer";
      item.onclick = () => switchDashboardTab("matches");
      item.innerHTML = `
        <div>
          <h4 class="font-bold text-sm">${match.title}</h4>
          <p class="text-xs text-muted mt-0.5">${match.company}</p>
        </div>
        <span class="px-2.5 py-1 border rounded-lg text-xs font-bold ${badgeClass}">${Math.round(match.matchPercentage)}% Match</span>
      `;
      matchSummaryContainer.appendChild(item);
    });
  } else {
    matchSummaryContainer.innerHTML = `<div class="text-muted text-sm py-4 italic">No matching job listings found in database.</div>`;
  }
}

// Render Resume Parser View details
function renderUploadedResumeView() {
  if (!state.resume) return;
  
  const resultsDiv = document.getElementById("parsed-resume-results");
  const filename = document.getElementById("parsed-filename");
  const timestamp = document.getElementById("parsed-timestamp");
  const chipsContainer = document.getElementById("parsed-skills-chips");

  resultsDiv.classList.remove("hidden");
  filename.textContent = state.resume.fileName;
  
  const uploadDate = new Date(state.resume.uploadedAt);
  timestamp.textContent = `Uploaded on ${uploadDate.toLocaleDateString()} at ${uploadDate.toLocaleTimeString()}`;

  chipsContainer.innerHTML = "";
  if (state.resume.skills && state.resume.skills.length > 0) {
    state.resume.skills.forEach(skill => {
      const chip = document.createElement("span");
      chip.className = "px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold shadow-sm hover:scale-105 transition-all";
      chip.textContent = skill;
      chipsContainer.appendChild(chip);
    });
  } else {
    chipsContainer.innerHTML = `<p class="text-xs text-muted italic">No distinct skills extracted from document text.</p>`;
  }
}

// Render Job Matches List with semantic detail toggles
function renderMatchesList() {
  const container = document.getElementById("matches-list-container");
  container.innerHTML = "";

  if (!state.resume || state.matches.length === 0) {
    container.innerHTML = `
      <div class="glass-panel p-8 text-center text-muted italic">
        <i data-lucide="alert-circle" class="w-8 h-8 mx-auto text-indigo-400 mb-3"></i>
        <span>Please upload a resume in the 'Resume Analyzer' tab first to compute semantic match scores.</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  state.matches.forEach((match, index) => {
    let category = "Weak Match";
    let badgeClass = "bg-danger/10 border-danger/20 text-danger";
    
    if (match.matchPercentage >= 80) {
      category = "Strong Match";
      badgeClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    } else if (match.matchPercentage >= 50) {
      category = "Near Match";
      badgeClass = "bg-amber-500/10 border-amber-500/20 text-amber-400";
    }

    const jobCard = document.createElement("div");
    jobCard.className = "glass-panel p-6 shadow-md hover:-translate-y-0.5 transition-all flex flex-col gap-4";
    jobCard.innerHTML = `
      <div class="flex flex-wrap justify-between items-start gap-4">
        <div>
          <span class="inline-block px-2 py-0.5 border rounded-full text-[10px] font-extrabold uppercase ${badgeClass} mb-2">${category}</span>
          <h3 class="text-xl font-bold text-main">${match.title}</h3>
          <p class="text-sm font-semibold text-indigo-400 mt-1">${match.company}</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <span class="text-2xl font-extrabold tracking-tight text-main">${Math.round(match.matchPercentage)}%</span>
            <p class="text-[10px] text-muted uppercase mt-0.5">Semantic Index</p>
          </div>
          <button onclick="toggleJobDetails(${index})" class="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all" title="Toggle AI Insights">
            <i data-lucide="chevron-down" id="match-chevron-${index}" class="w-5 h-5 transition-transform"></i>
          </button>
        </div>
      </div>

      <!-- Expandable details card -->
      <div id="match-details-${index}" class="hidden mt-4 pt-4 border-t border-white/5 space-y-4 animate-slide-in">
        <div>
          <h4 class="text-xs font-bold text-muted uppercase tracking-wider mb-2">Why It Matched (Semantic Reasoning)</h4>
          <p class="text-sm text-muted leading-relaxed p-4 bg-white/[0.01] border border-white/5 rounded-xl">
            ${match.whyMatched}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Matching Competencies</h4>
            <div class="flex flex-wrap gap-1.5">
              ${match.matchedSkills.length > 0 
                ? match.matchedSkills.map(s => `<span class="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">${s}</span>`).join("")
                : '<span class="text-xs text-muted italic">None matching yet.</span>'
              }
            </div>
          </div>
          <div>
            <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Missing Competencies (Gap)</h4>
            <div class="flex flex-wrap gap-1.5">
              ${match.missingSkills.length > 0 
                ? match.missingSkills.map(s => `<span class="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">${s}</span>`).join("")
                : '<span class="text-xs text-muted italic">None missing! Full coverage.</span>'
              }
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button onclick="navigateToGapAnalyzer('${match.title}')" class="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-1.5">
            <i data-lucide="git-pull-request" class="w-4 h-4"></i>
            <span>Analyze Skill Gap</span>
          </button>
          <button onclick="navigateToRoadmaps('${match.missingSkills[0] || ''}')" ${match.missingSkills.length === 0 ? 'disabled' : ''} class="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50">
            <i data-lucide="map" class="w-4 h-4"></i>
            <span>Compile Roadmap</span>
          </button>
        </div>
      </div>
    `;
    container.appendChild(jobCard);
  });
  lucide.createIcons();
}

function toggleJobDetails(index) {
  const panel = document.getElementById(`match-details-${index}`);
  const chevron = document.getElementById(`match-chevron-${index}`);
  
  if (panel.classList.contains("hidden")) {
    panel.classList.remove("hidden");
    chevron.style.transform = "rotate(180deg)";
  } else {
    panel.classList.add("hidden");
    chevron.style.transform = "rotate(0deg)";
  }
}

function navigateToGapAnalyzer(jobTitle) {
  switchDashboardTab("gap");
  setTimeout(() => {
    const selector = document.getElementById("gap-job-selector");
    selector.value = jobTitle;
    loadSkillGapAnalysis(jobTitle);
  }, 100);
}

function navigateToRoadmaps(skillName) {
  if (!skillName) return;
  switchDashboardTab("roadmaps");
  setTimeout(() => {
    const selector = document.getElementById("roadmap-skill-selector");
    selector.value = skillName;
    renderSkillRoadmap(skillName);
  }, 100);
}

// Skill Gap Selector Populator
function populateGapJobSelector() {
  const selector = document.getElementById("gap-job-selector");
  selector.innerHTML = `<option value="">Select a job match...</option>`;
  
  if (state.matches && state.matches.length > 0) {
    state.matches.forEach(match => {
      const opt = document.createElement("option");
      opt.value = match.title;
      opt.textContent = `${match.title} at ${match.company}`;
      selector.appendChild(opt);
    });
  }
}

// Load Skill Gap components
function loadSkillGapAnalysis(jobTitle) {
  const gapContent = document.getElementById("gap-analysis-content");
  const emptyState = document.getElementById("gap-empty-state");

  if (!jobTitle) {
    gapContent.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  const match = state.matches.find(m => m.title === jobTitle);
  if (!match) return;

  gapContent.classList.remove("hidden");
  emptyState.classList.add("hidden");

  // Possessed Skills chips
  const possessedContainer = document.getElementById("gap-possessed-skills");
  possessedContainer.innerHTML = "";
  if (match.matchedSkills.length > 0) {
    match.matchedSkills.forEach(skill => {
      const chip = document.createElement("span");
      chip.className = "px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shadow-sm";
      chip.textContent = skill;
      possessedContainer.appendChild(chip);
    });
  } else {
    possessedContainer.innerHTML = `<p class="text-xs text-muted italic p-2">None matching requirements.</p>`;
  }

  // Missing Skills chips
  const missingContainer = document.getElementById("gap-missing-skills");
  missingContainer.innerHTML = "";
  if (match.missingSkills.length > 0) {
    match.missingSkills.forEach(skill => {
      const chip = document.createElement("span");
      chip.className = "px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold shadow-sm cursor-pointer hover:bg-amber-500/20 transition-all";
      chip.title = "Click to compile timeline roadmap";
      chip.onclick = () => navigateToRoadmaps(skill);
      chip.innerHTML = `${skill} <i data-lucide="arrow-right" class="w-3.5 h-3.5 inline ml-1"></i>`;
      missingContainer.appendChild(chip);
    });
  } else {
    missingContainer.innerHTML = `<p class="text-xs text-emerald-400 font-semibold p-2">Excellent! No structural gaps identified.</p>`;
  }

  // AI Advice text
  const adviceText = document.getElementById("gap-ai-advice");
  adviceText.innerHTML = `
    Evaluating your compatibility for **${match.title}** at **${match.company}**: <br>
    Your semantic correspondence score is **${Math.round(match.matchPercentage)}%**. 
    ${match.missingSkills.length > 0 
      ? `To optimize your candidacy, you should prioritize developing **${match.missingSkills[0]}** as it represents a core structural blocker. `
      : 'Your background matches 100% of the core competencies!'
    } <br><br>
    *Recommendation:* ${match.whyMatched}
  `;
  lucide.createIcons();
}

// Learning Roadmap Selector populator
function populateRoadmapSkillSelector() {
  const selector = document.getElementById("roadmap-skill-selector");
  selector.innerHTML = `<option value="">Select a skill...</option>`;

  // Collect all unique missing skills across all job matches
  const uniqueMissing = new Set();
  state.matches.forEach(match => {
    match.missingSkills.forEach(skill => uniqueMissing.add(skill));
  });

  if (uniqueMissing.size > 0) {
    uniqueMissing.forEach(skill => {
      const opt = document.createElement("option");
      opt.value = skill;
      opt.textContent = skill.charAt(0).toUpperCase() + skill.slice(1);
      selector.appendChild(opt);
    });
  }
}

// Renders Study roadmaps vertical timeline
function renderSkillRoadmap(skillName) {
  const content = document.getElementById("roadmap-timeline-content");
  const emptyState = document.getElementById("roadmap-empty-state");

  if (!skillName) {
    content.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  content.classList.remove("hidden");
  emptyState.classList.add("hidden");

  document.getElementById("roadmap-target-name").textContent = skillName.charAt(0).toUpperCase() + skillName.slice(1);

  // Retrieve roadmap from current matches or call dynamic generator
  let roadmapStages = [];
  
  // Find match containing this skill in missingSkills
  const matchWithSkill = state.matches.find(m => m.missingSkills.includes(skillName));
  if (matchWithSkill) {
    const rmObj = matchWithSkill.learningRoadmaps.find(rm => rm.skill === skillName);
    if (rmObj) roadmapStages = rmObj.roadmap;
  }

  // Fallback dynamic compile if none
  if (roadmapStages.length === 0) {
    const cap = skillName.charAt(0).toUpperCase() + skillName.slice(1);
    roadmapStages = [
      `Master the core syntax, terminology, and standard parameters for ${cap}. (Estimated: 5 days)`,
      `Explore advanced features, asynchronous execution, and debugging hooks for ${cap}. (Estimated: 7 days)`,
      `Complete a functional, repository-backed project centered on ${cap}. (Estimated: 10 days)`,
      `Review online documents, code repositories, and free certification bootcamps. (Estimated: 3 days)`
    ];
  }

  const timelineContainer = document.getElementById("roadmap-timeline-steps");
  timelineContainer.innerHTML = "";

  const iconMapping = ["book-open", "layers", "code", "external-link"];
  const titleMapping = ["Stage 1: Core Fundamentals", "Stage 2: Intermediate Deep-dive", "Stage 3: Portfolio Engineering Project", "Stage 4: Free Learning Resources"];

  roadmapStages.forEach((stepText, idx) => {
    const item = document.createElement("div");
    item.className = "timeline-item animate-slide-in";
    
    // Add clickable resource links inside the 4th stage (Resources)
    let extraHTML = "";
    if (idx === 3) {
      const searchTerms = encodeURIComponent(skillName + " tutorial freecodecamp");
      extraHTML = `
        <div class="mt-4 flex flex-wrap gap-2">
          <a href="https://www.youtube.com/results?search_query=${searchTerms}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/35 text-indigo-400 text-xs font-semibold transition-all">
            <i data-lucide="youtube" class="w-3.5 h-3.5"></i>
            <span>YouTube Courses</span>
          </a>
          <a href="https://www.google.com/search?q=${searchTerms}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-400 text-xs font-semibold transition-all">
            <i data-lucide="globe" class="w-3.5 h-3.5"></i>
            <span>MDN / Official Docs</span>
          </a>
        </div>
      `;
    }

    item.innerHTML = `
      <div class="timeline-badge"></div>
      <div class="glass-panel p-5 ml-4">
        <h5 class="font-bold text-sm text-indigo-300 flex items-center gap-2 mb-2">
          <i data-lucide="${iconMapping[idx] || 'circle'}" class="w-4 h-4 text-indigo-400"></i>
          <span>${titleMapping[idx] || `Stage ${idx + 1}`}</span>
        </h5>
        <p class="text-sm text-muted leading-relaxed">${stepText}</p>
        ${extraHTML}
      </div>
    `;
    timelineContainer.appendChild(item);
  });
  lucide.createIcons();
}

// Chatbot messages dispatcher
async function submitChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById("chat-input-message");
  const msgText = input.value.trim();
  if (!msgText) return;

  // Render user bubble
  appendChatBubble("user", msgText);
  input.value = "";

  // Render typing bubble
  const typingId = appendChatBubble("typing", "AI is compiling resources...");

  try {
    // Collect active matching jobs details if any
    const currentJob = state.matches.length > 0 ? state.matches[0].title : null;
    const missing = state.matches.length > 0 ? state.matches[0].missingSkills : [];

    const res = await axios.post(`${API_BASE}/resume/chat`, {
      message: msgText,
      currentJobTitle: currentJob,
      missingSkills: missing
    }, {
      headers: { Authorization: `Bearer ${state.token}` }
    });

    // Remove typing bubble
    document.getElementById(typingId)?.remove();

    if (res.data.success) {
      appendChatBubble("bot", res.data.reply);
    }
  } catch (error) {
    document.getElementById(typingId)?.remove();
    appendChatBubble("bot", "Oops, I encountered a communication error with our FastAPI NLP server. Please ensure the backend and AI microservice are running!");
  }
}

function sendQuickPrompt(promptText) {
  const input = document.getElementById("chat-input-message");
  input.value = promptText;
  document.getElementById("chat-input-form").dispatchEvent(new Event("submit"));
}

function appendChatBubble(role, content) {
  const container = document.getElementById("chat-messages-container");
  const bubbleId = `bubble-${Date.now()}`;
  const bubble = document.createElement("div");
  bubble.id = bubbleId;
  bubble.className = "flex gap-3 animate-slide-in";

  if (role === "user") {
    bubble.className += " justify-end";
    bubble.innerHTML = `
      <div class="p-3 bg-indigo-600 border border-indigo-500 rounded-xl rounded-tr-none max-w-[80%] text-sm text-white leading-relaxed">
        <p>${content}</p>
      </div>
      <div class="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
        <i data-lucide="user" class="w-4 h-4"></i>
      </div>
    `;
  } else if (role === "typing") {
    bubble.innerHTML = `
      <div class="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
        <i data-lucide="bot" class="w-4 h-4"></i>
      </div>
      <div class="p-3 bg-white/5 border border-white/5 rounded-xl rounded-tl-none max-w-[80%] text-sm leading-relaxed text-muted italic flex items-center gap-2">
        <span class="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping"></span>
        <span>AI Career Agent typing...</span>
      </div>
    `;
  } else {
    // Convert markdown bold links in reply safely
    let formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    bubble.innerHTML = `
      <div class="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
        <i data-lucide="bot" class="w-4 h-4"></i>
      </div>
      <div class="p-3 bg-white/5 border border-white/5 rounded-xl rounded-tl-none max-w-[80%] text-sm leading-relaxed">
        <p>${formattedContent}</p>
      </div>
    `;
  }

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  lucide.createIcons();
  
  return bubbleId;
}

// ==========================================
// ADMIN PORTAL LOGIC
// ==========================================
async function loadAdminJobs() {
  try {
    const res = await axios.get(`${API_BASE}/jobs`);
    if (res.data.success) {
      document.getElementById("admin-jobs-count").textContent = `${res.data.count} Jobs`;
      
      const container = document.getElementById("admin-jobs-list");
      container.innerHTML = "";

      if (res.data.jobs.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-muted italic">No job postings seeded in database.</div>`;
        return;
      }

      res.data.jobs.forEach(job => {
        const item = document.createElement("div");
        item.className = "glass-panel p-5 border border-white/5 flex flex-col gap-3 relative";
        item.innerHTML = `
          <div class="flex justify-between items-start gap-4">
            <div>
              <span class="inline-block px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase mb-1.5">${job.type}</span>
              <h4 class="font-bold text-base text-main">${job.title}</h4>
              <p class="text-xs text-indigo-400 mt-0.5">${job.company} — <span class="text-muted">${job.location}</span></p>
            </div>
            <div class="flex items-center gap-1.5">
              <button onclick="editJob('${job._id}')" class="p-2 bg-white/5 border border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/20 hover:text-indigo-400 rounded-lg transition-all" title="Edit Post">
                <i data-lucide="edit" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteJobPost('${job._id}')" class="p-2 bg-white/5 border border-white/10 hover:bg-danger/10 hover:border-danger/20 hover:text-danger rounded-lg transition-all" title="Delete Post">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
          
          <div class="text-xs text-muted leading-relaxed truncate-2-lines">${job.description}</div>
          
          <div class="flex flex-wrap gap-1 mt-2">
            ${job.skills.map(s => `<span class="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-muted text-[10px]">${s}</span>`).join("")}
          </div>
        `;
        container.appendChild(item);
      });
      lucide.createIcons();
    }
  } catch (error) {
    showAdminAlert("Failed to load jobs list.", "danger");
  }
}

async function submitAdminJob(e) {
  e.preventDefault();
  
  const id = document.getElementById("admin-job-id").value;
  const title = document.getElementById("admin-title").value;
  const company = document.getElementById("admin-company").value;
  const location = document.getElementById("admin-location").value;
  const salary = document.getElementById("admin-salary").value;
  const experienceLevel = document.getElementById("admin-experience").value;
  const type = document.getElementById("admin-type").value;
  const skills = document.getElementById("admin-skills").value;
  const description = document.getElementById("admin-desc").value;

  const jobPayload = { title, company, location, salary, experienceLevel, type, skills, description };

  try {
    let res;
    if (id) {
      // Edit mode
      res = await axios.put(`${API_BASE}/jobs/${id}`, jobPayload, {
        headers: { Authorization: `Bearer ${state.token}` }
      });
    } else {
      // Create mode
      res = await axios.post(`${API_BASE}/jobs`, jobPayload, {
        headers: { Authorization: `Bearer ${state.token}` }
      });
    }

    if (res.data.success) {
      showAdminAlert(res.data.message || "Job posted successfully!", "emerald");
      resetAdminForm();
      loadAdminJobs();
      // Reload resume matching data in background
      fetchUserResumeData();
    }
  } catch (error) {
    showAdminAlert(error.response?.data?.message || "Failed to submit job posting.", "danger");
  }
}

async function editJob(id) {
  try {
    const res = await axios.get(`${API_BASE}/jobs/${id}`);
    if (res.data.success) {
      const job = res.data.job;
      
      document.getElementById("admin-job-id").value = job._id;
      document.getElementById("admin-title").value = job.title;
      document.getElementById("admin-company").value = job.company;
      document.getElementById("admin-location").value = job.location;
      document.getElementById("admin-salary").value = job.salary || "Competitive";
      document.getElementById("admin-experience").value = job.experienceLevel;
      document.getElementById("admin-type").value = job.type;
      document.getElementById("admin-skills").value = job.skills.join(", ");
      document.getElementById("admin-desc").value = job.description;

      document.getElementById("admin-form-title").textContent = "Modify Job Posting";
      document.getElementById("admin-submit-btn-text").textContent = "Save Changes";
      document.getElementById("admin-cancel-btn").classList.remove("hidden");
    }
  } catch (error) {
    showAdminAlert("Failed to fetch job details.", "danger");
  }
}

async function deleteJobPost(id) {
  if (!confirm("Are you sure you want to delete this job posting? This action is permanent.")) return;

  try {
    const res = await axios.delete(`${API_BASE}/jobs/${id}`, {
      headers: { Authorization: `Bearer ${state.token}` }
    });

    if (res.data.success) {
      showAdminAlert("Job deleted successfully!", "emerald");
      loadAdminJobs();
      fetchUserResumeData();
    }
  } catch (error) {
    showAdminAlert("Failed to delete job posting.", "danger");
  }
}

function resetAdminForm() {
  document.getElementById("admin-job-id").value = "";
  document.getElementById("admin-job-form").reset();
  document.getElementById("admin-form-title").textContent = "Create New Job Posting";
  document.getElementById("admin-submit-btn-text").textContent = "Publish Job";
  document.getElementById("admin-cancel-btn").classList.add("hidden");
}

function showAdminAlert(msg, type) {
  const alertBox = document.getElementById("admin-alert");
  const msgSpan = document.getElementById("admin-alert-msg");
  
  alertBox.classList.remove("hidden", "bg-emerald-500/10", "border-emerald-500/20", "text-emerald-400", "bg-danger/10", "border-danger/20", "text-danger");
  
  if (type === "emerald") {
    alertBox.classList.add("bg-emerald-500/10", "border-emerald-500/20", "text-emerald-400");
  } else {
    alertBox.classList.add("bg-danger/10", "border-danger/20", "text-danger");
  }
  
  alertBox.classList.remove("hidden");
  msgSpan.textContent = msg;

  setTimeout(() => {
    alertBox.classList.add("hidden");
  }, 4000);
}
