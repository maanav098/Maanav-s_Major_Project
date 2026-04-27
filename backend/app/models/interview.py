from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class InterviewStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EVALUATED = "evaluated"


class RecruiterDecision(str, enum.Enum):
    PENDING = "pending"
    SHORTLISTED = "shortlisted"
    ON_HOLD = "on_hold"
    REJECTED = "rejected"


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    role = Column(String, nullable=False)
    company = Column(String)
    status = Column(Enum(InterviewStatus), default=InterviewStatus.PENDING)

    questions_asked = Column(JSON, default=list)
    responses = Column(JSON, default=list)

    technical_score = Column(Float)
    communication_score = Column(Float)
    overall_score = Column(Float)
    feedback = Column(JSON)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    suggestions = Column(JSON, default=list)
    level_prediction = Column(String)

    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    recruiter_decision = Column(Enum(RecruiterDecision), default=RecruiterDecision.PENDING)
    recruiter_notes = Column(Text)
    decision_updated_at = Column(DateTime(timezone=True))

    candidate = relationship("Candidate", back_populates="interviews")
    job = relationship("Job", back_populates="interviews")
