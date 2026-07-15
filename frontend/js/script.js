console.log("script.js loaded");

async function uploadResume() {

  console.log("uploadResume called");
  const fileInput =
    document.getElementById("resumeInput");

  const loading =
    document.getElementById("loading");

  const result =
    document.getElementById("result");

  const skillsContainer =
    document.getElementById("skillsContainer");

  const jobsContainer =
    document.getElementById("jobsContainer");

  if (!fileInput) {
    alert("Resume input not found");
    return;
  }

  const file = fileInput.files[0];

  if (!file) {
    alert("Please upload a PDF");
    return;
  }

  const formData = new FormData();

  formData.append("resume", file);

  try {

    loading.classList.remove("hidden");

    result.classList.add("hidden");

    const isBackendOrigin =
      window.location.protocol.startsWith("http") &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1") &&
      window.location.port === "5000";
    const apiBaseUrl = isBackendOrigin ? "" : "http://localhost:5000";
    const apiUrl = `${apiBaseUrl}/api/resume/upload`;

    console.log("Uploading to API URL:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText} ${errorText}`
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const rawText = await response.text();
      throw new Error(
        `Invalid JSON response from server: ${jsonError.message} - ${rawText}`
      );
    }

    console.log("Resume upload response:", data);

    // Clear previous results
    skillsContainer.innerHTML = "";
    jobsContainer.innerHTML = "";

    const extractedSkills = Array.isArray(data.extractedSkills)
      ? data.extractedSkills
      : [];
    const matchedInternships = Array.isArray(data.matchedInternships)
      ? data.matchedInternships
      : [];

    // Show skills
    extractedSkills.forEach((skill) => {

      const skillTag =
        document.createElement("div");

      skillTag.className =
        "bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium";

      skillTag.innerText = skill;

      skillsContainer.appendChild(skillTag);
    });

    // Show internships
    matchedInternships.forEach((internship) => {
      console.log(internship);

      const card = document.createElement("div");
      card.className = "border rounded-2xl p-5 shadow-md";
      card.innerHTML = `
        <h3>
          ${internship.title}
        </h3>
        <p>
          ${internship.company}
        </p>
        <p>
          Match: ${internship.matchPercentage}
        </p>
      `;

      jobsContainer.appendChild(card);
    });

    loading.classList.add("hidden");

    result.classList.remove("hidden");

  } catch (error) {

    console.error(error);

    if (loading) loading.classList.add("hidden");
    if (result) result.classList.add("hidden");

    alert(`Error uploading resume: ${error.message}`);
  }
}