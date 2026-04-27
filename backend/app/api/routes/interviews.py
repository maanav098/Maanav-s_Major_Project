from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_candidate, get_current_recruiter
from app.models.user import User
from app.models.candidate import Candidate
from app.models.question import Question, QuestionType, Difficulty
from app.models.job import Job
from app.models.interview import Interview, InterviewStatus
from app.schemas.interview import InterviewCreate, InterviewResponse, AnswerSubmit, DecisionUpdate
from app.services.interview_engine import get_interview_questions
from app.services.evaluation_engine import evaluate_interview
from app.services.transcription import transcribe_audio, generate_follow_up
from app.services.code_runner import run_code as run_code_service


class FollowUpSubmit(BaseModel):
    question_id: int
    follow_up_answer: str


class TranscribeResponse(BaseModel):
    text: str


class RunCodeRequest(BaseModel):
    language: str
    version: str
    source: str
    stdin: str = ""

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

    role = interview_data.role
    company = interview_data.company
    num_questions = interview_data.num_questions
    categories: list[str] = []
    prepend_questions: list[Question] = []

    job = None
    if interview_data.job_id:
        job = db.query(Job).filter(Job.id == interview_data.job_id).first()
        if job:
            role = job.role
            company = job.company
            num_questions = job.num_questions or num_questions
            categories = list(job.question_categories or [])

            for cq in (job.custom_questions or []):
                text = (cq.get("question_text") or "").strip()
                if not text:
                    continue
                try:
                    qtype = QuestionType(cq.get("question_type") or "technical")
                except ValueError:
                    qtype = QuestionType.TECHNICAL
                custom_q = Question(
                    role=f"custom-job-{job.id}",
                    company=None,
                    difficulty=Difficulty.MEDIUM,
                    question_type=qtype,
                    topic="custom",
                    question_text=text,
                    time_limit_minutes=5,
                )
                db.add(custom_q)
                db.flush()
                prepend_questions.append(custom_q)

    questions = await get_interview_questions(
        role=role,
        company=company,
        db=db,
        num_questions=num_questions,
        categories=categories or None,
        prepend=prepend_questions or None,
    )

    interview = Interview(
        candidate_id=candidate.id,
        job_id=interview_data.job_id,
        role=role,
        company=company,
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


@router.post("/run-code")
async def run_code(
    payload: RunCodeRequest,
    current_user: User = Depends(get_current_user),
):
    return await run_code_service(
        language=payload.language,
        version=payload.version,
        source=payload.source,
        stdin=payload.stdin,
    )


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
    from app.models.job import Job

    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    role = current_user.role.value
    if role == "candidate":
        candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
        if not candidate or interview.candidate_id != candidate.id:
            raise HTTPException(status_code=404, detail="Interview not found")
    elif role == "recruiter":
        if not interview.job_id:
            raise HTTPException(status_code=404, detail="Interview not found")
        job = db.query(Job).filter(
            Job.id == interview.job_id, Job.recruiter_id == current_user.id
        ).first()
        if not job:
            raise HTTPException(status_code=404, detail="Interview not found")
    elif role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    return interview


@router.patch("/{interview_id}/decision", response_model=InterviewResponse)
async def update_decision(
    interview_id: int,
    payload: DecisionUpdate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview or not interview.job_id:
        raise HTTPException(status_code=404, detail="Interview not found")

    job = db.query(Job).filter(
        Job.id == interview.job_id, Job.recruiter_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.recruiter_decision = payload.decision
    interview.recruiter_notes = payload.notes
    interview.decision_updated_at = datetime.utcnow()
    db.commit()
    db.refresh(interview)
    return interview
