from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_candidate
from app.models.user import User
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateResponse, CandidateUpdate
from app.services.resume_parser import parse_resume

router = APIRouter()


@router.get("/me", response_model=CandidateResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return candidate


@router.put("/me", response_model=CandidateResponse)
async def update_my_profile(
    update_data: CandidateUpdate,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(candidate, field, value)

    db.commit()
    db.refresh(candidate)
    return candidate


@router.post("/me/resume", response_model=CandidateResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    content = await file.read()
    parsed_data = await parse_resume(content, file.filename)

    candidate.resume_text = parsed_data.get("text", "")
    candidate.skills = parsed_data.get("skills", [])

    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate
