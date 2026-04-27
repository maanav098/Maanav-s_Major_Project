from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_recruiter
from app.models.user import User
from app.models.candidate import Candidate
from app.models.interview import Interview, InterviewStatus, RecruiterDecision
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse, JobUpdate, JdAnalysisRequest, JdAnalysisResponse
from app.services.jd_analyzer import analyze_jd

router = APIRouter()


class JobInterviewSummary(BaseModel):
    interview_id: int
    candidate_id: int
    candidate_full_name: str
    candidate_email: str
    status: InterviewStatus
    overall_score: Optional[float]
    technical_score: Optional[float]
    communication_score: Optional[float]
    level_prediction: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    recruiter_decision: RecruiterDecision = RecruiterDecision.PENDING


@router.post("/", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db)
):
    job = Job(
        recruiter_id=current_user.id,
        **job_data.model_dump()
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    role: str = None,
    company: str = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Job)

    if role:
        query = query.filter(Job.role.ilike(f"%{role}%"))
    if company:
        query = query.filter(Job.company.ilike(f"%{company}%"))

    jobs = query.offset(skip).limit(limit).all()
    return jobs


@router.get("/my-jobs", response_model=List[JobResponse])
async def list_my_jobs(
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db)
):
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).all()
    return jobs


@router.post("/analyze-jd", response_model=JdAnalysisResponse)
async def analyze_jd_endpoint(
    payload: JdAnalysisRequest,
    current_user: User = Depends(get_current_recruiter),
):
    result = await analyze_jd(
        description=payload.description,
        role=payload.role,
        company=payload.company,
    )
    return JdAnalysisResponse(**result)


@router.get("/{job_id}/interviews", response_model=List[JobInterviewSummary])
async def list_job_interviews(
    job_id: int,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(
        Job.id == job_id, Job.recruiter_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    rows = (
        db.query(Interview, Candidate, User)
        .join(Candidate, Candidate.id == Interview.candidate_id)
        .join(User, User.id == Candidate.user_id)
        .filter(Interview.job_id == job_id)
        .order_by(Interview.created_at.desc())
        .all()
    )

    return [
        JobInterviewSummary(
            interview_id=interview.id,
            candidate_id=candidate.id,
            candidate_full_name=user.full_name,
            candidate_email=user.email,
            status=interview.status,
            overall_score=interview.overall_score,
            technical_score=interview.technical_score,
            communication_score=interview.communication_score,
            level_prediction=interview.level_prediction,
            started_at=interview.started_at,
            completed_at=interview.completed_at,
            created_at=interview.created_at,
            recruiter_decision=interview.recruiter_decision or RecruiterDecision.PENDING,
        )
        for interview, candidate, user in rows
    ]


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    update_data: JobUpdate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}
