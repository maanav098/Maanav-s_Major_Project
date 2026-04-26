from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, candidates, jobs, interviews, questions, evaluations, recruiters
from app.core.config import settings

app = FastAPI(
    title="AI Interview & Recruitment Platform",
    description="AI-powered platform for interview preparation and recruitment screening",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["Candidates"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["Interviews"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(evaluations.router, prefix="/api/evaluations", tags=["Evaluations"])
app.include_router(recruiters.router, prefix="/api/recruiters", tags=["Recruiters"])


@app.get("/")
async def root():
    return {"message": "AI Interview & Recruitment Platform API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
