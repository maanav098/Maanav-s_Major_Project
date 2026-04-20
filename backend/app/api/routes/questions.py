from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.question import Question, Difficulty
from app.schemas.question import QuestionCreate, QuestionResponse

router = APIRouter()


@router.post("/", response_model=QuestionResponse)
async def create_question(
    question_data: QuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    question = Question(**question_data.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("/", response_model=List[QuestionResponse])
async def list_questions(
    role: str = None,
    company: str = None,
    difficulty: Difficulty = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Question)

    if role:
        query = query.filter(Question.role.ilike(f"%{role}%"))
    if company:
        query = query.filter(Question.company.ilike(f"%{company}%"))
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)

    questions = query.offset(skip).limit(limit).all()
    return questions


@router.get("/roles")
async def get_available_roles(db: Session = Depends(get_db)):
    roles = db.query(Question.role).distinct().all()
    return [r[0] for r in roles]


@router.get("/companies")
async def get_available_companies(db: Session = Depends(get_db)):
    companies = db.query(Question.company).distinct().filter(Question.company.isnot(None)).all()
    return [c[0] for c in companies]


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: int,
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question
