from typing import Dict, List, Any
from sqlalchemy.orm import Session
import json
import re
from openai import OpenAI

from app.models.interview import Interview
from app.models.question import Question
from app.services.role_company_engine import get_company_config, calculate_level_thresholds
from app.core.config import settings

# Initialize OpenAI client
client = None
if settings.OPENAI_API_KEY:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)


async def evaluate_interview(interview: Interview, db: Session) -> Dict[str, Any]:
    responses_data = interview.responses or []

    question_scores = []
    detailed_feedback = []

    for response in responses_data:
        question_id = response.get("question_id")
        answer = response.get("answer", "")

        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            continue

        # Use LLM evaluation if available, otherwise fallback to keyword-based
        if client:
            score_result = await evaluate_with_llm(answer, question)
        else:
            score_result = evaluate_with_keywords(answer, question)

        question_scores.append(score_result)
        detailed_feedback.append({
            "question_id": question_id,
            "question": question.question_text,
            "answer": answer,
            "score": score_result["score"],
            "feedback": score_result["feedback"],
            "key_points_covered": score_result.get("key_points_covered", []),
            "missed_points": score_result.get("missed_points", [])
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

    # Use LLM for overall analysis if available
    if client and question_scores:
        analysis = await analyze_with_llm(interview, detailed_feedback, overall_score)
        strengths = analysis.get("strengths", [])
        weaknesses = analysis.get("weaknesses", [])
        suggestions = analysis.get("suggestions", [])
    else:
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


async def evaluate_with_llm(answer: str, question: Question) -> Dict[str, Any]:
    """Use OpenAI GPT to evaluate the answer with semantic understanding."""

    if not answer or len(answer.strip()) < 10:
        return {
            "score": 0,
            "technical": 0,
            "communication": 0,
            "feedback": "No substantial answer provided.",
            "key_points_covered": [],
            "missed_points": question.key_points.split(",") if question.key_points else []
        }

    prompt = f"""You are an expert technical interviewer evaluating a candidate's answer.

QUESTION: {question.question_text}

EXPECTED ANSWER/KEY CONCEPTS: {question.expected_answer or 'Not provided'}

KEY POINTS TO COVER: {question.key_points or 'Not specified'}

CANDIDATE'S ANSWER: {answer}

Evaluate the answer and respond with a JSON object containing:
{{
    "technical_score": <0-100, how well they understood and explained the technical concepts>,
    "communication_score": <0-100, clarity, structure, and articulation>,
    "feedback": "<2-3 sentences of constructive feedback>",
    "key_points_covered": ["<list of key concepts they correctly addressed>"],
    "missed_points": ["<list of important concepts they missed or could improve>"]
}}

IMPORTANT EVALUATION GUIDELINES:
- If the answer contains CODE, evaluate the code's correctness and approach, not just keywords
- Consider semantic equivalence (e.g., "linear time" = "O(n)", "calls itself" = "recursion")
- A correct algorithm implementation should score high even without textual explanation
- Focus on whether they UNDERSTOOD the concept, not just whether they used specific words
- Be fair but rigorous - this is interview preparation

Respond ONLY with the JSON object, no other text."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500
        )

        result_text = response.choices[0].message.content.strip()

        # Clean up the response - remove markdown code blocks if present
        if result_text.startswith("```"):
            result_text = re.sub(r'^```json?\s*', '', result_text)
            result_text = re.sub(r'\s*```$', '', result_text)

        result = json.loads(result_text)

        technical = float(result.get("technical_score", 50))
        communication = float(result.get("communication_score", 50))
        overall = (technical * 0.7) + (communication * 0.3)

        return {
            "score": round(overall, 1),
            "technical": round(technical, 1),
            "communication": round(communication, 1),
            "feedback": result.get("feedback", ""),
            "key_points_covered": result.get("key_points_covered", []),
            "missed_points": result.get("missed_points", [])
        }

    except Exception as e:
        print(f"LLM evaluation failed: {e}, falling back to keyword matching")
        return evaluate_with_keywords(answer, question)


async def analyze_with_llm(interview: Interview, detailed_feedback: List[Dict], overall_score: float) -> Dict[str, Any]:
    """Use LLM to generate overall interview analysis."""

    feedback_summary = "\n".join([
        f"Q: {f['question'][:50]}... | Score: {f['score']} | Feedback: {f['feedback']}"
        for f in detailed_feedback
    ])

    prompt = f"""You are an expert interview coach analyzing a candidate's overall performance.

ROLE: {interview.role}
COMPANY: {interview.company or 'General'}
OVERALL SCORE: {overall_score}/100

QUESTION-BY-QUESTION PERFORMANCE:
{feedback_summary}

Based on this performance, provide:
{{
    "strengths": ["<3-4 specific strengths demonstrated>"],
    "weaknesses": ["<2-3 areas needing improvement>"],
    "suggestions": ["<3-4 actionable improvement tips specific to their performance>"]
}}

Be specific and constructive. Reference their actual answers where relevant.
Respond ONLY with the JSON object."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=400
        )

        result_text = response.choices[0].message.content.strip()
        if result_text.startswith("```"):
            result_text = re.sub(r'^```json?\s*', '', result_text)
            result_text = re.sub(r'\s*```$', '', result_text)

        return json.loads(result_text)

    except Exception as e:
        print(f"LLM analysis failed: {e}")
        return {"strengths": [], "weaknesses": [], "suggestions": []}


def evaluate_with_keywords(answer: str, question: Question) -> Dict[str, Any]:
    """Fallback keyword-based evaluation when LLM is not available."""

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

    # Calculate similarity
    answer_lower = answer.lower()
    expected_lower = expected.lower()

    answer_words = set(re.findall(r'\b\w+\b', answer_lower))
    expected_words = set(re.findall(r'\b\w+\b', expected_lower))

    if expected_words:
        overlap = len(answer_words & expected_words)
        similarity_score = (overlap / len(expected_words | answer_words)) * 100
    else:
        similarity_score = min(len(answer.split()) / 50 * 100, 70)

    # Check key points with synonyms
    key_points_covered = []
    missed_points = []

    synonyms = {
        "o(n)": ["linear time", "single pass", "one pass", "n time"],
        "o(1)": ["constant time", "constant space"],
        "recursion": ["recursive", "recursively", "calls itself"],
        "hash map": ["hashmap", "dictionary", "dict", "hash table"],
        "two pointers": ["two pointer", "2 pointers", "dual pointer"],
        "binary search": ["bisect", "divide and conquer"],
        "dynamic programming": ["dp", "memoization", "memo"],
    }

    for point in key_points:
        point = point.strip().lower()
        if not point:
            continue

        found = point in answer_lower

        # Check synonyms
        if not found:
            for key, syns in synonyms.items():
                if point in key or key in point:
                    for syn in syns:
                        if syn in answer_lower:
                            found = True
                            break
                if found:
                    break

        if found:
            key_points_covered.append(point)
        else:
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


def evaluate_communication(answer: str) -> float:
    """Evaluate communication quality of the answer."""
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
    """Generate feedback for a single answer."""
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
    """Analyze overall performance from scores."""
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
    """Generate improvement suggestions based on weaknesses."""
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
    """Predict candidate level based on score."""
    thresholds = calculate_level_thresholds(company)

    for level, range_vals in thresholds.items():
        if range_vals["min"] <= overall_score < range_vals["max"]:
            readiness = int(((overall_score - range_vals["min"]) / (range_vals["max"] - range_vals["min"])) * 100)
            return f"You are at {level} level ({readiness}% readiness for next level)"

    return f"You are at Entry Level ({int(overall_score)}% overall readiness)"


def generate_summary(technical: float, communication: float, overall: float) -> str:
    """Generate performance summary."""
    if overall >= 80:
        performance = "Excellent"
    elif overall >= 65:
        performance = "Good"
    elif overall >= 50:
        performance = "Average"
    else:
        performance = "Needs Improvement"

    return f"{performance} performance. Technical: {technical:.0f}/100, Communication: {communication:.0f}/100, Overall: {overall:.0f}/100"
