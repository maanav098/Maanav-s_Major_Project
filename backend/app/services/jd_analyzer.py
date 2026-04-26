from typing import Dict, Any, List
import json
import re
from openai import OpenAI

from app.core.config import settings

client = None
if settings.OPENAI_API_KEY:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)


VALID_CATEGORIES = ["technical", "behavioral", "system_design", "coding", "case_study"]


def _heuristic_analysis(description: str, role: str = None) -> Dict[str, Any]:
    text = (description or "").lower()
    role_l = (role or "").lower()

    categories = ["technical", "behavioral"]
    if any(k in text for k in ["code", "coding", "algorithm", "data structure", "leetcode"]):
        if "coding" not in categories:
            categories.append("coding")
    if any(k in text for k in ["system design", "scalab", "architecture", "distributed"]):
        if "system_design" not in categories:
            categories.append("system_design")
    if "case" in text or "consult" in text or "product manager" in role_l:
        if "case_study" not in categories:
            categories.append("case_study")

    skill_keywords = [
        "python", "javascript", "typescript", "java", "go", "rust", "c++",
        "react", "vue", "angular", "node", "fastapi", "django", "flask",
        "aws", "gcp", "azure", "docker", "kubernetes", "terraform",
        "sql", "postgres", "mysql", "mongodb", "redis",
        "ml", "machine learning", "tensorflow", "pytorch", "nlp",
    ]
    skills = [s for s in skill_keywords if s in text]

    return {
        "suggested_categories": categories,
        "suggested_skills": [s.title() if len(s) > 3 else s.upper() for s in skills][:8],
        "suggested_num_questions": 10,
        "rationale": "Heuristic analysis (OpenAI key not configured).",
    }


async def analyze_jd(description: str, role: str = None, company: str = None) -> Dict[str, Any]:
    if not description or not description.strip():
        return {
            "suggested_categories": ["technical", "behavioral"],
            "suggested_skills": [],
            "suggested_num_questions": 10,
            "rationale": "Empty description — using defaults.",
        }

    if not client:
        return _heuristic_analysis(description, role)

    prompt = f"""You are an expert technical recruiter analyzing a job description to design an interview.

JOB DESCRIPTION:
{description}

ROLE: {role or "(not specified)"}
COMPANY: {company or "(not specified)"}

Available question categories: technical, behavioral, system_design, coding, case_study

Produce a JSON object with this exact shape:
{{
  "suggested_categories": [<2-4 category strings from the list above>],
  "suggested_skills": [<3-8 specific technical skills mentioned or implied>],
  "suggested_num_questions": <integer between 5 and 20>,
  "rationale": "<one sentence explaining the choices>"
}}

Guidelines:
- Pick categories that match the seniority and nature of the role.
- For SDE/engineering roles include "coding". For senior roles include "system_design".
- Always include "behavioral" unless the role is purely technical screening.
- "case_study" is for PM, consulting, strategy roles.
- Skills should be concrete (e.g., "Python", "AWS", "PostgreSQL"), not generic ("teamwork").
- 5-8 questions for short screens, 10-15 for full loops, up to 20 for senior deep-dives.

Respond ONLY with the JSON object, no other text."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=400,
        )
        result_text = response.choices[0].message.content.strip()
        if result_text.startswith("```"):
            result_text = re.sub(r'^```json?\s*', '', result_text)
            result_text = re.sub(r'\s*```$', '', result_text)
        result = json.loads(result_text)

        cats = [c for c in result.get("suggested_categories", []) if c in VALID_CATEGORIES]
        if not cats:
            cats = ["technical", "behavioral"]

        skills = result.get("suggested_skills", [])
        if not isinstance(skills, list):
            skills = []
        skills = [str(s).strip() for s in skills if str(s).strip()][:10]

        try:
            n = int(result.get("suggested_num_questions", 10))
        except (TypeError, ValueError):
            n = 10
        n = max(5, min(20, n))

        return {
            "suggested_categories": cats,
            "suggested_skills": skills,
            "suggested_num_questions": n,
            "rationale": str(result.get("rationale", ""))[:300],
        }
    except Exception as e:
        print(f"JD analysis (LLM) failed: {e}, falling back to heuristic")
        return _heuristic_analysis(description, role)
