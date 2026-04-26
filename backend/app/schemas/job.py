from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.job import JobStatus


class CustomQuestion(BaseModel):
    question_text: str
    question_type: str = "technical"


class JobCreate(BaseModel):
    title: str
    role: str
    company: str
    description: Optional[str] = None
    requirements: List[str] = []
    required_skills: List[str] = []
    experience_min: int = 0
    experience_max: Optional[int] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    num_questions: int = 10
    question_categories: List[str] = []
    custom_questions: List[CustomQuestion] = []


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    experience_min: Optional[int] = None
    experience_max: Optional[int] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    status: Optional[JobStatus] = None
    num_questions: Optional[int] = None
    question_categories: Optional[List[str]] = None
    custom_questions: Optional[List[CustomQuestion]] = None


class JobResponse(BaseModel):
    id: int
    recruiter_id: int
    title: str
    role: str
    company: str
    description: Optional[str]
    requirements: List[str]
    required_skills: List[str]
    experience_min: int
    experience_max: Optional[int]
    location: Optional[str]
    salary_range: Optional[str]
    status: JobStatus
    num_questions: int = 10
    question_categories: List[str] = []
    custom_questions: List[CustomQuestion] = []
    created_at: datetime

    class Config:
        from_attributes = True


class JdAnalysisRequest(BaseModel):
    description: str
    role: Optional[str] = None
    company: Optional[str] = None


class JdAnalysisResponse(BaseModel):
    suggested_categories: List[str]
    suggested_skills: List[str]
    suggested_num_questions: int
    rationale: Optional[str] = None
