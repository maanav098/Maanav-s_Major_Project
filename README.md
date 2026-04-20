# AI Interview & Recruitment Platform

An AI-powered platform that helps candidates prepare for interviews and enables recruiters to efficiently screen and evaluate talent using role-based and company-aware intelligence.

## Features

### For Candidates
- Practice interviews tailored to specific roles (SDE, ML Engineer, Data Scientist, etc.)
- Company-specific question styles (Amazon, Google, Microsoft, Meta, etc.)
- AI-powered evaluation with detailed feedback
- Technical and communication score breakdown
- Level prediction (Entry, SDE-1, SDE-2, Senior, etc.)
- Actionable improvement suggestions

### For Recruiters
- Post job descriptions
- Screen candidates with resume matching
- View interview scores and rankings
- Access detailed evaluation reports

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JWT

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + React Query
- **Routing**: React Router v6

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Config, database, security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   │   ├── evaluation_engine.py    # AI scoring
│   │   │   ├── interview_engine.py     # Question selection
│   │   │   ├── resume_parser.py        # Resume parsing
│   │   │   └── role_company_engine.py  # Role/company mapping
│   │   ├── data/          # Question dataset
│   │   └── utils/         # Utilities
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/    # Reusable components
    │   ├── pages/         # Page components
    │   ├── context/       # React context
    │   ├── services/      # API services
    │   └── types/         # TypeScript types
    └── package.json
```

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations (creates tables)
python -c "from app.core.database import Base, engine; from app.models import *; Base.metadata.create_all(bind=engine)"

# Seed questions
python -m app.utils.seed_questions

# Start server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Candidates
- `GET /api/candidates/me` - Get profile
- `PUT /api/candidates/me` - Update profile
- `POST /api/candidates/me/resume` - Upload resume

### Jobs (Recruiters)
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs/{id}` - Get job details
- `PUT /api/jobs/{id}` - Update job
- `DELETE /api/jobs/{id}` - Delete job

### Interviews
- `POST /api/interviews/start` - Start new interview
- `POST /api/interviews/{id}/answer` - Submit answer
- `POST /api/interviews/{id}/complete` - Complete & evaluate
- `GET /api/interviews/my-interviews` - List my interviews

### Evaluations
- `GET /api/evaluations/interview/{id}` - Get evaluation results
- `POST /api/evaluations/match-resumes` - Match resumes to job

## Evaluation System

The AI evaluation engine scores candidates on:

1. **Technical Score** (0-100)
   - Keyword matching with expected answers
   - Key points coverage
   - Semantic similarity

2. **Communication Score** (0-100)
   - Answer structure and clarity
   - Use of examples
   - Proper formatting

3. **Overall Score**
   - Weighted combination based on company style
   - Amazon: 40% behavioral weight
   - Google/Meta: 20% behavioral weight
   - Others: 25-35% behavioral weight

4. **Level Prediction**
   - Entry Level / Junior: 0-50
   - SDE-1 / Associate: 50-65
   - SDE-2 / Mid-Level: 65-80
   - Senior / SDE-3: 80-90
   - Staff / Principal: 90+

## Company Interview Styles

| Company | Focus | Difficulty |
|---------|-------|------------|
| Amazon | Leadership Principles, STAR format | Hard |
| Google | Problem-solving, ambiguous problems | Hard |
| Microsoft | Balanced technical/behavioral | Medium |
| Meta | Coding heavy, move fast | Hard |
| Apple | Design, attention to detail | Hard |
| Netflix | Culture fit, senior judgment | Hard |
| Startup | Practical, versatile | Medium |

## Future Enhancements

- Voice-based interviews
- Video analysis for body language
- Bias detection in evaluations
- Advanced ML scoring with LLMs
- Real-time collaboration for recruiters

## License

MIT License - Built for Major Project
