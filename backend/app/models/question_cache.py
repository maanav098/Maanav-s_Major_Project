from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.sql import func

from app.core.database import Base


class QuestionCache(Base):
    __tablename__ = "question_cache"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False, default="", index=True)
    question_ids_json = Column(Text, nullable=False)
    fetched_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (Index("ix_question_cache_role_company", "role", "company"),)
