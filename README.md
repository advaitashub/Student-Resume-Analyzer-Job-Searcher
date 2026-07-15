# 🎯 Student Resume Analyzer & Job Searcher

An AI-powered web application that helps students analyze their resumes, identify missing skills, and discover relevant internships and jobs based on their profile.

## 🚀 Features

- 📄 Resume upload (PDF)
- 🤖 AI-powered resume skill extraction
- 📊 Semantic resume-job matching
- 🎯 Match percentage for each job
- 🧠 Missing skills detection
- 💡 Personalized skill recommendations
- 💼 Internship & job recommendations
- 🔐 User authentication (Login/Signup)
- 📱 Responsive UI

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- Tailwind CSS
- JavaScript

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Multer (File Upload)

### AI Service
- Python
- FastAPI
- Sentence Transformers
- spaCy

---

## 📂 Project Structure

```
Student-Resume-Analyzer/
│
├── frontend/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── uploads/
│   └── server.js
│
├── ai-service/
│   ├── app.py
│   ├── requirements.txt
│   └── model/
│
├── package.json
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/advaitashub/Student-Resume-Analyzer-Job-Searcher.git
```

Move into the project folder

```bash
cd Student-Resume-Analyzer-Job-Searcher
```

---

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder.

Example:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

Start backend

```bash
npm run dev
```

---

### AI Service Setup

```bash
cd ai-service
```

Create a virtual environment

```bash
python -m venv venv
```

Activate it

Windows

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run FastAPI

```bash
uvicorn app:app --reload
```

---

## 📈 How It Works

1. User signs in.
2. Uploads a resume.
3. AI extracts technical skills.
4. Resume is converted into embeddings.
5. Job descriptions are embedded.
6. Semantic similarity is calculated.
7. Best matching internships/jobs are displayed.
8. Missing skills are identified.
9. AI suggests skills to improve employability.

---

## 📸 Screenshots

Add screenshots of:

- Home Page
- Resume Upload
- Dashboard
- Resume Analysis
- Job Recommendations

---

## 🔮 Future Improvements

- Google Authentication
- Resume Score
- ATS Compatibility Checker
- Learning Roadmap Generator
- Company Recommendation Engine
- Cover Letter Generator
- Interview Question Generator

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a new branch.
3. Commit your changes.
4. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👩‍💻 Author

**Advaita Singh**

- GitHub: https://github.com/advaitashub
- LinkedIn: *https://www.linkedin.com/in/advaita-singh-41a81b257/*

---

⭐ If you found this project useful, consider giving it a star.
