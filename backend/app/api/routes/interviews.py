from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_candidate
from app.models.user import User
from app.models.candidate import Candidate
from app.models.question import Question
from app.models.interview import Interview, InterviewStatus
from app.schemas.interview import InterviewCreate, InterviewResponse, AnswerSubmit
from app.services.interview_engine import get_interview_questions
from app.services.evaluation_engine import evaluate_interview
from app.services.transcription import transcribe_audio, generate_follow_up


class FollowUpSubmit(BaseModel):
    question_id: int
    follow_up_answer: str


class TranscribeResponse(BaseModel):
    text: str

router = APIRouter()


@router.post("/start", response_model=InterviewResponse)
async def start_interview(
    interview_data: InterviewCreate,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    questions = await get_interview_questions(
        role=interview_data.role,
        company=interview_data.company,
        db=db,
        num_questions=interview_data.num_questions
    )

    interview = Interview(
        candidate_id=candidate.id,
        job_id=interview_data.job_id,
        role=interview_data.role,
        company=interview_data.company,
        status=InterviewStatus.IN_PROGRESS,
        questions_asked=[{"id": q.id, "question": q.question_text, "type": q.question_type.value} for q in questions],
        responses=[],
        started_at=datetime.utcnow()
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


@router.post("/{interview_id}/answer", response_model=InterviewResponse)
async def submit_answer(
    interview_id: int,
    answer_data: AnswerSubmit,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.candidate_id == candidate.id
    ).first()

    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if interview.status != InterviewStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Interview is not in progress")

    question = db.query(Question).filter(Question.id == answer_data.question_id).first()
    follow_up = None
    if question:
        follow_up = await generate_follow_up(question.question_text, answer_data.answer)

    responses = list(interview.responses or [])
    new_response = {
        "question_id": answer_data.question_id,
        "answer": answer_data.answer,
        "submitted_at": datetime.utcnow().isoformat(),
    }
    if follow_up:
        new_response["follow_up_question"] = follow_up
    responses.append(new_response)
    interview.responses = responses
    flag_modified(interview, "responses")

    db.commit()
    db.refresh(interview)
    return interview


@router.post("/{interview_id}/follow-up", response_model=InterviewResponse)
async def submit_follow_up(
    interview_id: int,
    data: FollowUpSubmit,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.candidate_id == candidate.id
    ).first()

    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if interview.status != InterviewStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Interview is not in progress")

    responses = list(interview.responses or [])
    target = None
    for r in reversed(responses):
        if r.get("question_id") == data.question_id and "follow_up_question" in r and "follow_up_answer" not in r:
            target = r
            break
    if not target:
        raise HTTPException(status_code=400, detail="No pending follow-up for this question")

    target["follow_up_answer"] = data.follow_up_answer
    target["follow_up_submitted_at"] = datetime.utcnow().isoformat()
    interview.responses = responses
    flag_modified(interview, "responses")

    db.commit()
    db.refresh(interview)
    return interview


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_candidate),
):
    content = await audio.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty audio file")
    try:
        text = await transcribe_audio(content, audio.filename or "audio.webm")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    return TranscribeResponse(text=text)


@router.post("/{interview_id}/complete", response_model=InterviewResponse)
async def complete_interview(
    interview_id: int,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.candidate_id == candidate.id
    ).first()

    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.status = InterviewStatus.COMPLETED
    interview.completed_at = datetime.utcnow()

    evaluation = await evaluate_interview(interview, db)

    interview.technical_score = evaluation["technical_score"]
    interview.communication_score = evaluation["communication_score"]
    interview.overall_score = evaluation["overall_score"]
    interview.strengths = evaluation["strengths"]
    interview.weaknesses = evaluation["weaknesses"]
    interview.suggestions = evaluation["suggestions"]
    interview.level_prediction = evaluation["level_prediction"]
    interview.feedback = evaluation["detailed_feedback"]
    interview.status = InterviewStatus.EVALUATED

    db.commit()
    db.refresh(interview)
    return interview


@router.get("/my-interviews", response_model=List[InterviewResponse])
async def list_my_interviews(
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    interviews = db.query(Interview).filter(Interview.candidate_id == candidate.id).all()
    return interviews


@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview
