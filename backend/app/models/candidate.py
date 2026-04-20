from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_text = Column(Text)
    resume_file_path = Column(String)
    skills = Column(JSON, default=list)
    experience_years = Column(Integer, default=0)
    education = Column(String)
    phone = Column(String)
    linkedin_url = Column(String)
    github_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="candidate_profile")
    interviews = relationship("Interview", back_populates="candidate")
