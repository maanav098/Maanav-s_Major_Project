from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.question import Question, QuestionType
from app.services.question_sourcing import source_questions


async def get_interview_questions(
    role: str,
    company: str,
    db: Session,
    num_questions: int = 10,
    categories: Optional[List[str]] = None,
    prepend: Optional[List[Question]] = None,
    jd: Optional[str] = None,
) -> List[Question]:
    """Return the question rows for a new interview.

    Order: recruiter custom (prepend) → web-sourced/LLM-generated for the rest →
    seeded local pool only as a final-final safety net (e.g. no OpenAI key).
    """
    prepend = prepend or []
    remaining = max(0, num_questions - len(prepend))
    if remaining == 0:
        return list(prepend)

    sourced = await source_questions(
        role=role,
        company=company or None,
        jd=jd,
        num=remaining,
        categories=categories,
        db=db,
    )

    if len(sourced) >= remaining:
        return list(prepend) + sourced[:remaining]

    needed = remaining - len(sourced)
    fallback_q = db.query(Question).filter(
        ~Question.role.like("sourced:%"),
        ~Question.role.like("custom-job-%"),
    )
    if categories:
        try:
            cat_enums = [QuestionType(c) for c in categories if c]
            if cat_enums:
                fallback_q = fallback_q.filter(Question.question_type.in_(cat_enums))
        except ValueError:
            pass
    if role:
        fallback_q = fallback_q.filter(Question.role.ilike(f"%{role}%"))
    fallback = fallback_q.limit(needed).all()

    return list(prepend) + list(sourced) + list(fallback)


def format_question_for_interview(question: Question) -> dict:
    return {
        "id": question.id,
        "question": question.question_text,
        "type": question.question_type.value,
        "difficulty": question.difficulty.value,
        "topic": question.topic,
        "time_limit": question.time_limit_minutes,
    }
