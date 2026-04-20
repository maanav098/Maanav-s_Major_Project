from typing import Dict, List, Any
from sqlalchemy.orm import Session
import re
from difflib import SequenceMatcher

from app.models.interview import Interview
from app.models.question import Question
from app.services.role_company_engine import get_company_config, calculate_level_thresholds


async def evaluate_interview(interview: Interview, db: Session) -> Dict[str, Any]:
    questions_data = interview.questions_asked or []
    responses_data = interview.responses or []

    question_scores = []
    detailed_feedback = []

    for response in responses_data:
        question_id = response.get("question_id")
        answer = response.get("answer", "")

        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            continue

        score_result = evaluate_single_answer(answer, question)
        question_scores.append(score_result)
        detailed_feedback.append({
            "question_id": question_id,
            "question": question.question_text,
            "answer": answer,
            "score": score_result["score"],
            "feedback": score_result["feedback"],
            "key_points_covered": score_result["key_points_covered"],
            "missed_points": score_result["missed_points"]
        })

    if question_scores:
        technical_score = sum(s["technical"] for s in question_scores) / len(question_scores)
        communication_score = sum(s["communication"] for s in question_scores) / len(question_scores)
    else:
        technical_score = 0
        communication_score = 0

    company_config = get_company_config(interview.company)
    behavioral_weight = company_config.get("behavioral_weight", 0.3)
    overall_score = (technical_score * (1 - behavioral_weight)) + (communication_score * behavioral_weight)

    strengths, weaknesses = analyze_performance(question_scores, detailed_feedback)
    suggestions = generate_suggestions(weaknesses, interview.role)
    level_prediction = predict_level(overall_score, interview.company)

    return {
        "technical_score": round(technical_score, 1),
        "communication_score": round(communication_score, 1),
        "overall_score": round(overall_score, 1),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "level_prediction": level_prediction,
        "detailed_feedback": {
            "per_question": detailed_feedback,
            "summary": generate_summary(technical_score, communication_score, overall_score)
        }
    }


def evaluate_single_answer(answer: str, question: Question) -> Dict[str, Any]:
    if not answer or len(answer.strip()) < 10:
        return {
            "score": 0,
            "technical": 0,
            "communication": 0,
            "feedback": "No substantial answer provided",
            "key_points_covered": [],
            "missed_points": question.key_points.split(",") if question.key_points else []
        }

    expected = question.expected_answer or ""
    key_points = question.key_points.split(",") if question.key_points else []

    similarity_score = calculate_semantic_similarity(answer, expected)

    key_points_covered = []
    missed_points = []
    for point in key_points:
        point = point.strip().lower()
        if point and point in answer.lower():
            key_points_covered.append(point)
        elif point:
            missed_points.append(point)

    if key_points:
        coverage_score = (len(key_points_covered) / len(key_points)) * 100
    else:
        coverage_score = similarity_score

    technical_score = (similarity_score * 0.4) + (coverage_score * 0.6)

    communication_score = evaluate_communication(answer)

    overall = (technical_score * 0.7) + (communication_score * 0.3)

    feedback = generate_answer_feedback(technical_score, communication_score, key_points_covered, missed_points)

    return {
        "score": round(overall, 1),
        "technical": round(technical_score, 1),
        "communication": round(communication_score, 1),
        "feedback": feedback,
        "key_points_covered": key_points_covered,
        "missed_points": missed_points
    }


def calculate_semantic_similarity(answer: str, expected: str) -> float:
    if not expected:
        return min(len(answer.split()) / 50 * 100, 70)

    answer_lower = answer.lower()
    expected_lower = expected.lower()

    answer_words = set(re.findall(r'\b\w+\b', answer_lower))
    expected_words = set(re.findall(r'\b\w+\b', expected_lower))

    if not expected_words:
        return 50

    overlap = len(answer_words & expected_words)
    jaccard = overlap / len(expected_words | answer_words) if (expected_words | answer_words) else 0

    sequence_ratio = SequenceMatcher(None, answer_lower, expected_lower).ratio()

    return ((jaccard * 50) + (sequence_ratio * 50))


def evaluate_communication(answer: str) -> float:
    score = 50

    words = answer.split()
    word_count = len(words)

    if 50 <= word_count <= 300:
        score += 15
    elif 30 <= word_count < 50 or 300 < word_count <= 500:
        score += 10
    elif word_count < 30:
        score -= 10

    sentences = re.split(r'[.!?]+', answer)
    if len(sentences) >= 3:
        score += 10

    structure_keywords = ['first', 'second', 'then', 'finally', 'because', 'therefore', 'for example', 'in conclusion']
    for keyword in structure_keywords:
        if keyword in answer.lower():
            score += 3

    if re.search(r'\b(I would|I think|In my opinion|My approach)\b', answer, re.IGNORECASE):
        score += 5

    return min(score, 100)


def generate_answer_feedback(technical_score: float, communication_score: float,
                             key_points_covered: List[str], missed_points: List[str]) -> str:
    feedback_parts = []

    if technical_score >= 80:
        feedback_parts.append("Excellent technical understanding demonstrated.")
    elif technical_score >= 60:
        feedback_parts.append("Good technical knowledge shown.")
    elif technical_score >= 40:
        feedback_parts.append("Basic technical concepts covered.")
    else:
        feedback_parts.append("Technical depth needs improvement.")

    if communication_score >= 70:
        feedback_parts.append("Well-structured and clear explanation.")
    elif communication_score >= 50:
        feedback_parts.append("Reasonably clear communication.")
    else:
        feedback_parts.append("Could improve clarity and structure.")

    if key_points_covered:
        feedback_parts.append(f"Covered: {', '.join(key_points_covered[:3])}.")

    if missed_points:
        feedback_parts.append(f"Consider mentioning: {', '.join(missed_points[:2])}.")

    return " ".join(feedback_parts)


def analyze_performance(scores: List[Dict], detailed: List[Dict]) -> tuple:
    strengths = []
    weaknesses = []

    avg_technical = sum(s["technical"] for s in scores) / len(scores) if scores else 0
    avg_communication = sum(s["communication"] for s in scores) / len(scores) if scores else 0

    if avg_technical >= 70:
        strengths.append("Strong technical knowledge")
    elif avg_technical < 50:
        weaknesses.append("Technical concepts need improvement")

    if avg_communication >= 70:
        strengths.append("Clear and structured communication")
    elif avg_communication < 50:
        weaknesses.append("Communication clarity needs work")

    high_scores = [d for d in detailed if d["score"] >= 70]
    if high_scores:
        strengths.append(f"Performed well on {len(high_scores)} questions")

    all_missed = []
    for d in detailed:
        all_missed.extend(d.get("missed_points", []))

    if all_missed:
        common_missed = list(set(all_missed))[:3]
        if common_missed:
            weaknesses.append(f"Missed key concepts: {', '.join(common_missed)}")

    return strengths or ["Shows potential"], weaknesses or ["Keep practicing"]


def generate_suggestions(weaknesses: List[str], role: str) -> List[str]:
    suggestions = []

    if any("technical" in w.lower() for w in weaknesses):
        suggestions.append(f"Review core {role} concepts and practice more problems")
        suggestions.append("Focus on understanding fundamentals before advanced topics")

    if any("communication" in w.lower() for w in weaknesses):
        suggestions.append("Practice explaining your thought process step-by-step")
        suggestions.append("Use the STAR method for behavioral questions")

    if any("missed" in w.lower() for w in weaknesses):
        suggestions.append("Study common interview topics for your target role")

    if not suggestions:
        suggestions = [
            "Continue practicing to maintain your performance",
            "Try harder difficulty questions to challenge yourself"
        ]

    return suggestions[:4]


def predict_level(overall_score: float, company: str) -> str:
    thresholds = calculate_level_thresholds(company)

    for level, range_vals in thresholds.items():
        if range_vals["min"] <= overall_score < range_vals["max"]:
            readiness = int(((overall_score - range_vals["min"]) / (range_vals["max"] - range_vals["min"])) * 100)
            return f"You are at {level} level ({readiness}% readiness for next level)"

    return f"You are at Entry Level ({int(overall_score)}% overall readiness)"


def generate_summary(technical: float, communication: float, overall: float) -> str:
    if overall >= 80:
        performance = "Excellent"
    elif overall >= 65:
        performance = "Good"
    elif overall >= 50:
        performance = "Average"
    else:
        performance = "Needs Improvement"

    return f"{performance} performance. Technical: {technical:.0f}/100, Communication: {communication:.0f}/100, Overall: {overall:.0f}/100"
