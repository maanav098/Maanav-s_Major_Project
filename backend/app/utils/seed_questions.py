import json
import os
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.question import Question, Difficulty, QuestionType


def seed_questions():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        existing = db.query(Question).count()
        if existing > 0:
            print(f"Database already has {existing} questions. Skipping seed.")
            return

        data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'questions.json')
        with open(data_path, 'r') as f:
            questions_data = json.load(f)

        for q in questions_data:
            question = Question(
                role=q['role'],
                company=q.get('company'),
                difficulty=Difficulty(q['difficulty']),
                question_type=QuestionType(q['question_type']),
                topic=q.get('topic'),
                question_text=q['question_text'],
                expected_answer=q.get('expected_answer'),
                key_points=q.get('key_points'),
                time_limit_minutes=q.get('time_limit_minutes', 5)
            )
            db.add(question)

        db.commit()
        print(f"Successfully seeded {len(questions_data)} questions!")

    except Exception as e:
        print(f"Error seeding questions: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_questions()
