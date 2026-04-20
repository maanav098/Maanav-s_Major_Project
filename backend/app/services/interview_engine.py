from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
import random

from app.models.question import Question, Difficulty
from app.services.role_company_engine import get_role_config, get_company_config, get_difficulty_weights


async def get_interview_questions(
    role: str,
    company: str,
    db: Session,
    num_questions: int = 10
) -> List[Question]:
    role_config = get_role_config(role)
    company_config = get_company_config(company)
    difficulty_weights = get_difficulty_weights(company_config)

    query = db.query(Question).filter(Question.role.ilike(f"%{role}%"))

    if company:
        company_questions = query.filter(Question.company.ilike(f"%{company}%")).all()
        general_questions = query.filter(
            (Question.company.is_(None)) | (Question.company == "")
        ).all()
    else:
        company_questions = []
        general_questions = query.all()

    all_questions = company_questions + general_questions

    if not all_questions:
        all_questions = db.query(Question).limit(num_questions).all()

    if len(all_questions) <= num_questions:
        return all_questions

    easy_qs = [q for q in all_questions if q.difficulty == Difficulty.EASY]
    medium_qs = [q for q in all_questions if q.difficulty == Difficulty.MEDIUM]
    hard_qs = [q for q in all_questions if q.difficulty == Difficulty.HARD]

    selected = []

    num_easy = int(num_questions * difficulty_weights["easy"])
    num_hard = int(num_questions * difficulty_weights["hard"])
    num_medium = num_questions - num_easy - num_hard

    if easy_qs:
        selected.extend(random.sample(easy_qs, min(num_easy, len(easy_qs))))
    if medium_qs:
        selected.extend(random.sample(medium_qs, min(num_medium, len(medium_qs))))
    if hard_qs:
        selected.extend(random.sample(hard_qs, min(num_hard, len(hard_qs))))

    while len(selected) < num_questions and all_questions:
        remaining = [q for q in all_questions if q not in selected]
        if remaining:
            selected.append(random.choice(remaining))
        else:
            break

    random.shuffle(selected)
    return selected[:num_questions]


def format_question_for_interview(question: Question) -> dict:
    return {
        "id": question.id,
        "question": question.question_text,
        "type": question.question_type.value,
        "difficulty": question.difficulty.value,
        "topic": question.topic,
        "time_limit": question.time_limit_minutes
    }
