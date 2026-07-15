# skills_dict.py

SKILLS_DICTIONARY = {
    "JavaScript": ["javascript", "js", "ecmascript", "es6", "es5"],
    "React": ["react", "reactjs", "react.js", "react js"],
    "Node.js": ["node", "node.js", "nodejs", "node js"],
    "Express.js": ["Express","express", "expressjs", "express.js", "express js"],
    "MongoDB": ["mongodb", "mongo", "mongo db"],
    "Python": ["python", "py", "python3", "python2"],
    "C++": ["c++", "cpp"],
    "C": ["c"],
    "Java": ["java"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind css"],
    "Bootstrap": ["bootstrap"],
    "TypeScript": ["typescript", "ts"],
    "SQL": ["sql", "mysql", "postgresql", "sqlite", "postgres"],
    "Git": ["git", "github", "gitlab"],
    "Docker": ["docker"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services", "ec2", "s3"],
    "TensorFlow": ["tensorflow", "tf"],
    "PyTorch": ["pytorch"],
    "Scikit-learn": ["sklearn", "scikit-learn", "scikitlearn"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Next.js": ["nextjs", "next.js", "next js"],
    "Vue.js": ["vue", "vuejs", "vue.js"],
    "Angular": ["angular", "angularjs"],
    "Django": ["django"],
    "Flask": ["flask"],
    "FastAPI": ["fastapi"],
    "GraphQL": ["graphql"],
    "REST API": ["rest api", "restful api", "rest apis"],
    "Redux": ["redux"],
    "Figma": ["figma"],
    "CI/CD": ["ci/cd", "jenkins", "github actions"],
    "Linux": ["linux", "ubuntu"],
    "Firebase": ["firebase"],
    "Communication": ["communication", "public speaking", "writing", "presentation"],
    "Teamwork": ["teamwork", "collaboration", "team player"],
    "Problem Solving": ["problem solving", "analytical thinking", "critical thinking"],
    "Leadership": ["leadership", "management", "mentoring"]
}

def normalize_skill(skill_name: str) -> str:
    """
    Normalizes skill names to standard format using synonym database.
    """
    lowered = skill_name.strip().lower()
    for standard_name, synonyms in SKILLS_DICTIONARY.items():
        if lowered in synonyms:
            return standard_name
    return skill_name.title()
