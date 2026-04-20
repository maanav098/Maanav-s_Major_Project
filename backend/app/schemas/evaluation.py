from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class EvaluationRequest(BaseModel):
    interview_id: int


class EvaluationResponse(BaseModel):
    interview_id: int
    technical_score: float
    communication_score: float
    overall_score: float
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    level_prediction: str
    detailed_feedback: Dict[str, Any]


class ResumeMatchRequest(BaseModel):
    job_id: int
    candidate_ids: List[int]


class ResumeMatchResponse(BaseModel):
    job_id: int
    rankings: List[Dict[str, Any]]
