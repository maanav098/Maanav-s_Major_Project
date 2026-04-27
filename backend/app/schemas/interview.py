from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.interview import InterviewStatus, RecruiterDecision


class InterviewCreate(BaseModel):
    role: str
    company: Optional[str] = None
    job_id: Optional[int] = None
    num_questions: int = 10


class InterviewUpdate(BaseModel):
    status: Optional[InterviewStatus] = None
    responses: Optional[List[Dict[str, Any]]] = None


class AnswerSubmit(BaseModel):
    question_id: int
    answer: str


class DecisionUpdate(BaseModel):
    decision: RecruiterDecision
    notes: Optional[str] = None


class InterviewResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: Optional[int]
    role: str
    company: Optional[str]
    status: InterviewStatus
    questions_asked: List[Dict[str, Any]]
    responses: List[Dict[str, Any]]
    technical_score: Optional[float]
    communication_score: Optional[float]
    overall_score: Optional[float]
    feedback: Optional[Dict[str, Any]]
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    level_prediction: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    recruiter_decision: RecruiterDecision = RecruiterDecision.PENDING
    recruiter_notes: Optional[str] = None
    decision_updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
