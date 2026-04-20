from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.job import JobStatus


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
    created_at: datetime

    class Config:
        from_attributes = True
