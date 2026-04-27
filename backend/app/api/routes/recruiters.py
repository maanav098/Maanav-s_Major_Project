from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_recruiter
from app.models.user import User
from app.models.candidate import Candidate
from app.models.interview import Interview, InterviewStatus, RecruiterDecision
from app.models.job import Job

router = APIRouter()


class RecruiterCandidateRow(BaseModel):
    candidate_id: int
    user_id: int
    full_name: str
    email: str
    interview_count: int
    best_overall_score: Optional[float] = None
    latest_interview_at: Optional[datetime] = None
    latest_interview_id: int
    latest_decision: RecruiterDecision = RecruiterDecision.PENDING


@router.get("/me/candidates", response_model=List[RecruiterCandidateRow])
async def list_my_candidates(
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Candidate.id.label("candidate_id"),
            User.id.label("user_id"),
            User.full_name.label("full_name"),
            User.email.label("email"),
            func.count(Interview.id).label("interview_count"),
            func.max(Interview.overall_score).label("best_overall_score"),
            func.max(Interview.created_at).label("latest_interview_at"),
        )
        .join(User, User.id == Candidate.user_id)
        .join(Interview, Interview.candidate_id == Candidate.id)
        .join(Job, Job.id == Interview.job_id)
        .filter(Job.recruiter_id == current_user.id)
        .group_by(Candidate.id, User.id, User.full_name, User.email)
        .all()
    )

    result: List[RecruiterCandidateRow] = []
    for r in rows:
        latest = (
            db.query(Interview.id, Interview.recruiter_decision)
            .join(Job, Job.id == Interview.job_id)
            .filter(
                Interview.candidate_id == r.candidate_id,
                Job.recruiter_id == current_user.id,
            )
            .order_by(Interview.created_at.desc())
            .first()
        )
        latest_id = latest[0] if latest else 0
        latest_decision = (latest[1] if latest else None) or RecruiterDecision.PENDING
        result.append(
            RecruiterCandidateRow(
                candidate_id=r.candidate_id,
                user_id=r.user_id,
                full_name=r.full_name,
                email=r.email,
                interview_count=r.interview_count,
                best_overall_score=r.best_overall_score,
                latest_interview_at=r.latest_interview_at,
                latest_interview_id=latest_id,
                latest_decision=latest_decision,
            )
        )
    return result
