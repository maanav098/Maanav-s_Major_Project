from sqlalchemy import Column, Integer, String, Text, Enum, DateTime
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuestionType(str, enum.Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SYSTEM_DESIGN = "system_design"
    CODING = "coding"
    CASE_STUDY = "case_study"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False, index=True)
    company = Column(String, index=True)
    difficulty = Column(Enum(Difficulty), default=Difficulty.MEDIUM)
    question_type = Column(Enum(QuestionType), default=QuestionType.TECHNICAL)
    topic = Column(String)
    question_text = Column(Text, nullable=False)
    expected_answer = Column(Text)
    key_points = Column(Text)
    source_url = Column(String, nullable=True)
    time_limit_minutes = Column(Integer, default=5)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
