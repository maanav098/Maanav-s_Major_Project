from pydantic import BaseModel
from typing import Optional
from app.models.question import Difficulty, QuestionType


class QuestionCreate(BaseModel):
    role: str
    company: Optional[str] = None
    difficulty: Difficulty = Difficulty.MEDIUM
    question_type: QuestionType = QuestionType.TECHNICAL
    topic: Optional[str] = None
    question_text: str
    expected_answer: Optional[str] = None
    key_points: Optional[str] = None
    time_limit_minutes: int = 5


class QuestionResponse(BaseModel):
    id: int
    role: str
    company: Optional[str]
    difficulty: Difficulty
    question_type: QuestionType
    topic: Optional[str]
    question_text: str
    expected_answer: Optional[str]
    key_points: Optional[str]
    time_limit_minutes: int

    class Config:
        from_attributes = True
