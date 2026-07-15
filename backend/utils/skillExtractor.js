const skillsDatabase = [
  "c++",
  "python",
  "javascript",
  "node",
  "express",
  "mongodb",
  "java",
  "django",
  "tensorflow",
  "pandas",
  "numpy",
  "html",
  "css",
  "bootstrap",
  "tailwind",
  "react",
  "sql",
];

const extractSkills = (text) => {

  const extractedSkills = skillsDatabase.filter(
    (skill) => text.includes(skill)
  );

  return extractedSkills;
};

module.exports = extractSkills;