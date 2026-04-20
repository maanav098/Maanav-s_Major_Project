from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_recruiter
from app.models.user import User
from app.models.interview import Interview
from app.models.candidate import Candidate
from app.models.job import Job
from app.schemas.evaluation import EvaluationResponse, ResumeMatchRequest, ResumeMatchResponse
from app.services.resume_parser import match_resume_to_job

router = APIRouter()


@router.get("/interview/{interview_id}", response_model=EvaluationResponse)
async def get_evaluation(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if not interview.overall_score:
        raise HTTPException(status_code=400, detail="Interview not yet evaluated")

    return EvaluationResponse(
        interview_id=interview.id,
        technical_score=interview.technical_score,
        communication_score=interview.communication_score,
        overall_score=interview.overall_score,
        strengths=interview.strengths or [],
        weaknesses=interview.weaknesses or [],
        suggestions=interview.suggestions or [],
        level_prediction=interview.level_prediction or "",
        detailed_feedback=interview.feedback or {}
    )


@router.post("/match-resumes", response_model=ResumeMatchResponse)
async def match_resumes_to_job(
    match_request: ResumeMatchRequest,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == match_request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    candidates = db.query(Candidate).filter(Candidate.id.in_(match_request.candidate_ids)).all()

    rankings = []
    for candidate in candidates:
        score = await match_resume_to_job(candidate, job)
        rankings.append({
            "candidate_id": candidate.id,
            "match_score": score["overall_score"],
            "skill_match": score["skill_match"],
            "experience_match": score["experience_match"],
            "matched_skills": score["matched_skills"],
            "missing_skills": score["missing_skills"]
        })

    rankings.sort(key=lambda x: x["match_score"], reverse=True)

    return ResumeMatchResponse(job_id=job.id, rankings=rankings)


@router.get("/job/{job_id}/candidates")
async def get_job_candidates_ranked(
    job_id: int,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    interviews = db.query(Interview).filter(Interview.job_id == job_id).all()

    results = []
    for interview in interviews:
        candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
        results.append({
            "candidate_id": candidate.id,
            "interview_id": interview.id,
            "overall_score": interview.overall_score,
            "technical_score": interview.technical_score,
            "communication_score": interview.communication_score,
            "level_prediction": interview.level_prediction,
            "status": interview.status.value
        })

    results.sort(key=lambda x: x["overall_score"] or 0, reverse=True)
    return results
