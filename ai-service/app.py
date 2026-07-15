# app.py
import re
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import spacy
from skills_dict import SKILLS_DICTIONARY, normalize_skill

# Initialize FastAPI app
app = FastAPI(title="Resume Analyser AI Microservice")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)

# Load Sentence Transformer model
print("Loading Sentence Transformer model (all-MiniLM-L6-v2)...")
try:
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Sentence Transformer model loaded successfully.")
except Exception as e:
    print(f"Error loading Sentence Transformer: {e}")
    model = None

print("Loading spaCy model...")
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("spaCy model 'en_core_web_sm' not found. Downloading...")
    import subprocess
    import sys
    subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")
print("spaCy model loaded successfully.")

# Input Schemas
class SkillsExtractionRequest(BaseModel):
    text: str

class JobMatchItem(BaseModel):
    id: Optional[str] = None
    title: str
    company: str
    skills: List[str]
    description: str

class SemanticMatchRequest(BaseModel):
    resume_text: str
    resume_skills: List[str]
    jobs: List[JobMatchItem]

class ChatbotRequest(BaseModel):
    message: str
    user_skills: List[str]
    current_job_title: Optional[str] = None
    missing_skills: Optional[List[str]] = None

# Helper function for skill extraction with regex and boundaries
def extract_skills_nlp(text: str) -> List[str]:
    cleaned_text = text.lower()
    extracted = set()
    
    # Simple tokenization / boundary-aware regex search
    for standard_name, synonyms in SKILLS_DICTIONARY.items():
        for synonym in synonyms:
            # Escape regex characters
            escaped_synonym = re.escape(synonym)
            # Create regex with word boundaries
            # Handle special characters like C++ or .NET separately
            if "++" in synonym or "#" in synonym or "." in synonym:
                # Custom boundary matching for C++, C#, .NET, etc.
                pattern = rf"(?:^|\s|\b){escaped_synonym}(?:\s|\b|$)"
            else:
                pattern = rf"\b{escaped_synonym}\b"
                
            if re.search(pattern, cleaned_text):
                extracted.add(standard_name)
                break # Move to next skill once matched
                
    return sorted(list(extracted))

@app.post("/api/extract-skills")
def extract_skills(request: SkillsExtractionRequest):
    try:
        skills = extract_skills_nlp(request.text)
        return {
            "success": True,
            "skills": skills
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/semantic-match")
def semantic_match(request: SemanticMatchRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Sentence Transformer model not available")
        
    try:
        # Create resume profile text for embedding
        skills_str = ", ".join(request.resume_skills)
        resume_profile = f"Skills: {skills_str}. Experience and education text: {request.resume_text}"
        
        # Calculate resume embedding
        resume_embedding = model.encode(resume_profile, convert_to_tensor=True)
        
        results = []
        for job in request.jobs:
            job_skills_str = ", ".join(job.skills)
            job_profile = f"Job Title: {job.title} at {job.company}. Required Skills: {job_skills_str}. Description: {job.description}"
            
            # Embed job profile
            job_embedding = model.encode(job_profile, convert_to_tensor=True)
            
            # Cosine similarity
            # Convert tensors to numpy arrays
            res_emb_np = resume_embedding.cpu().numpy()
            job_emb_np = job_embedding.cpu().numpy()
            
            similarity = np.dot(res_emb_np, job_emb_np) / (np.linalg.norm(res_emb_np) * np.linalg.norm(job_emb_np))
            score = float(similarity) * 100
            
            # Normalize both job skills and resume skills to standard terms to ensure perfect matching
            normalized_job_skills = [normalize_skill(s) for s in job.skills]
            normalized_resume_skills = [normalize_skill(s) for s in request.resume_skills]
            
            matched_skills = [skill for skill in normalized_job_skills if skill in normalized_resume_skills]
            missing_skills = [skill for skill in normalized_job_skills if skill not in normalized_resume_skills]

            # Calculate exact skill coverage percentage
            if len(normalized_job_skills) > 0:
                skill_coverage = len(matched_skills) / len(normalized_job_skills)
            else:
                skill_coverage = 1.0

            # Blend exact skill coverage (85% weight) with AI Semantic Similarity (15% weight)
            # This ensures highly intuitive percentages: 0 skills matches yield ~6%, almost all matches yield ~80%, etc.
            blended_score = (skill_coverage * 100 * 0.85) + (score * 0.15)

            # Ensure the score is within [0, 100]
            final_score = max(0.0, min(100.0, blended_score))
            
            # Generate why it matched explanation
            why_matched = ""
            if final_score >= 80:
                why_matched = f"Strong Match: Your background aligns excellently with the key requirements for {job.title}. You have major required skills like {', '.join(matched_skills[:3])}."
            elif final_score >= 50:
                why_matched = f"Near Match: You have a solid foundation with skills like {', '.join(matched_skills[:2]) if matched_skills else 'general experience'}, but there are some critical skill gaps like {', '.join(missing_skills[:3])} that you should bridge."
            else:
                why_matched = f"Weak Match: This position requires high focus on {', '.join(job.skills[:3])}, which are not highly represented in your current profile. We suggest learning {', '.join(missing_skills[:3])} to become competitive."
                
            results.append({
                "title": job.title,
                "company": job.company,
                "matchPercentage": round(final_score, 2),
                "matchedSkills": matched_skills,
                "missingSkills": missing_skills,
                "whyMatched": why_matched
            })
            
        # Sort by match percentage
        results.sort(key=lambda x: x["matchPercentage"], reverse=True)
        
        return {
            "success": True,
            "matches": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat-assistant")
def chat_assistant(request: ChatbotRequest):
    msg = request.message.lower()
    skills_str = ", ".join(request.user_skills)
    
    # Rule/NLP based intelligent response generator
    if "skills" in msg or "learn" in msg or "improve" in msg:
        if request.missing_skills:
            missing = ", ".join(request.missing_skills)
            reply = (
                f"Based on your profile, your active skills are: **{skills_str}**.\n\n"
                f"To qualify for your targeted roles, you should focus on acquiring these missing skills: **{missing}**.\n\n"
                f"I recommend prioritizing the topmost missing skill. Would you like me to map out a complete learning roadmap for one of them?"
            )
        else:
            reply = (
                f"You have a great set of skills: **{skills_str}**!\n\n"
                f"To further improve, I suggest specializing in system architecture, CI/CD, or cloud deployments (like AWS/Docker) which are highly valued in senior roles."
            )
    elif "eligible" in msg or "can i apply" in msg:
        if request.current_job_title:
            reply = (
                f"For the **{request.current_job_title}** role, you have a solid set of skills, but you are currently missing: **{', '.join(request.missing_skills) if request.missing_skills else 'nothing! You are fully eligible!'}**.\n\n"
                f"If your match percentage is above 60%, I highly recommend applying! Highlight your work in {', '.join(request.user_skills[:3])} in your application."
            )
        else:
            reply = (
                "You are eligible for roles that align with your skillset. Upload your resume on the dashboard to see your specific eligibility and match percentages across all our open postings!"
            )
    elif "resume" in msg or "portfolio" in msg:
        reply = (
            "Here are three tips to immediately improve your resume:\n"
            "1. **Use Action Verbs**: Instead of 'Responsible for React development', write 'Designed and built 15+ highly responsive React dashboards'.\n"
            "2. **Quantify Metrics**: Show business impact (e.g., 'Optimized database queries, reducing page load times by 40%').\n"
            "3. **Tailor to Job Descriptions**: Ensure the top 5 skills of your target job are prominently listed in your 'Skills' section."
        )
    elif "internship" in msg or "career" in msg or "job" in msg:
        reply = (
            f"The current job market is actively looking for developers with expertise in both core technologies and modern cloud services.\n\n"
            f"Given your current skills (**{skills_str if request.user_skills else 'No skills uploaded yet'}**), you're positioned well for roles matching those. "
            f"Consider building a standout full-stack project using your primary technologies and deploying it on Vercel or Render to show recruiters you can deliver production-ready code."
        )
    else:
        reply = (
            f"Hello! I am your AI Career Assistant. I can help you analyze your skill gap, draft roadmap plans, and prepare for interviews.\n\n"
            f"Feel free to ask questions like:\n"
            f"- *'Am I eligible for the Frontend Intern role?'*\n"
            f"- *'What skills should I learn to bridge my gap?'*\n"
            f"- *'Give me tips to improve my resume.'*"
        )
        
    return {
        "success": True,
        "reply": reply
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
