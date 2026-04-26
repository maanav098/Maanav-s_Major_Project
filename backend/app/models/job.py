from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    OPEN = "open"
    CLOSED = "closed"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    role = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False, index=True)
    description = Column(Text)
    requirements = Column(JSON, default=list)
    required_skills = Column(JSON, default=list)
    experience_min = Column(Integer, default=0)
    experience_max = Column(Integer)
    location = Column(String)
    salary_range = Column(String)
    status = Column(Enum(JobStatus), default=JobStatus.OPEN)
    num_questions = Column(Integer, default=10)
    question_categories = Column(JSON, default=list)
    custom_questions = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    recruiter = relationship("User", backref="posted_jobs")
    interviews = relationship("Interview", back_populates="job")
