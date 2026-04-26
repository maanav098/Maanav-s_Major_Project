from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import random

from app.models.question import Question, Difficulty, QuestionType
from app.services.role_company_engine import get_role_config, get_company_config, get_difficulty_weights


async def get_interview_questions(
    role: str,
    company: str,
    db: Session,
    num_questions: int = 10,
    categories: Optional[List[str]] = None,
    prepend: Optional[List[Question]] = None,
) -> List[Question]:
    role_config = get_role_config(role)
    company_config = get_company_config(company)
    difficulty_weights = get_difficulty_weights(company_config)

    prepend = prepend or []
    remaining = max(0, num_questions - len(prepend))

    if remaining == 0:
        return list(prepend)

    query = db.query(Question).filter(Question.role.ilike(f"%{role}%"))

    if categories:
        try:
            cat_enums = [QuestionType(c) for c in categories if c]
            if cat_enums:
                query = query.filter(Question.question_type.in_(cat_enums))
        except ValueError:
            pass

    if company:
        company_questions = query.filter(Question.company.ilike(f"%{company}%")).all()
        general_questions = query.filter(
            (Question.company.is_(None)) | (Question.company == "")
        ).all()
    else:
        company_questions = []
        general_questions = query.all()

    all_questions = company_questions + general_questions

    prepend_ids = {q.id for q in prepend}
    all_questions = [q for q in all_questions if q.id not in prepend_ids]

    if not all_questions:
        fallback = db.query(Question)
        if categories:
            try:
                cat_enums = [QuestionType(c) for c in categories if c]
                if cat_enums:
                    fallback = fallback.filter(Question.question_type.in_(cat_enums))
            except ValueError:
                pass
        all_questions = fallback.limit(remaining).all()

    if len(all_questions) <= remaining:
        selected = all_questions
    else:
        easy_qs = [q for q in all_questions if q.difficulty == Difficulty.EASY]
        medium_qs = [q for q in all_questions if q.difficulty == Difficulty.MEDIUM]
        hard_qs = [q for q in all_questions if q.difficulty == Difficulty.HARD]

        selected = []
        num_easy = int(remaining * difficulty_weights["easy"])
        num_hard = int(remaining * difficulty_weights["hard"])
        num_medium = remaining - num_easy - num_hard

        if easy_qs:
            selected.extend(random.sample(easy_qs, min(num_easy, len(easy_qs))))
        if medium_qs:
            selected.extend(random.sample(medium_qs, min(num_medium, len(medium_qs))))
        if hard_qs:
            selected.extend(random.sample(hard_qs, min(num_hard, len(hard_qs))))

        while len(selected) < remaining and all_questions:
            leftover = [q for q in all_questions if q not in selected]
            if leftover:
                selected.append(random.choice(leftover))
            else:
                break

        random.shuffle(selected)
        selected = selected[:remaining]

    return list(prepend) + selected


def format_question_for_interview(question: Question) -> dict:
    return {
        "id": question.id,
        "question": question.question_text,
        "type": question.question_type.value,
        "difficulty": question.difficulty.value,
        "topic": question.topic,
        "time_limit": question.time_limit_minutes
    }
