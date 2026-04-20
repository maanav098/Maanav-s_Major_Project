from typing import Dict, List, Any
import re
import io

COMMON_SKILLS = {
    "programming": ["python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin"],
    "frontend": ["react", "angular", "vue", "html", "css", "sass", "tailwind", "bootstrap", "jquery", "redux"],
    "backend": ["node", "express", "django", "flask", "fastapi", "spring", "rails", "laravel", "asp.net"],
    "database": ["sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "dynamodb", "firebase"],
    "cloud": ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "ci/cd"],
    "ml": ["machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "nlp", "computer vision"],
    "tools": ["git", "linux", "agile", "scrum", "jira", "confluence"]
}


async def parse_resume(content: bytes, filename: str) -> Dict[str, Any]:
    if filename.lower().endswith('.pdf'):
        text = extract_text_from_pdf(content)
    elif filename.lower().endswith('.docx'):
        text = extract_text_from_docx(content)
    else:
        text = content.decode('utf-8', errors='ignore')

    skills = extract_skills(text)
    experience = extract_experience_years(text)
    education = extract_education(text)
    contact = extract_contact_info(text)

    return {
        "text": text,
        "skills": skills,
        "experience_years": experience,
        "education": education,
        "contact": contact
    }


def extract_text_from_pdf(content: bytes) -> str:
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception:
        return ""


def extract_text_from_docx(content: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception:
        return ""


def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found_skills = []

    for category, skills in COMMON_SKILLS.items():
        for skill in skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)

    skill_patterns = [
        r'skills?\s*[:\-]?\s*([^\n]+)',
        r'technologies?\s*[:\-]?\s*([^\n]+)',
        r'proficient\s+in\s*[:\-]?\s*([^\n]+)'
    ]

    for pattern in skill_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            words = re.findall(r'\b\w+\b', match)
            found_skills.extend([w for w in words if len(w) > 2])

    return list(set(found_skills))


def extract_experience_years(text: str) -> int:
    patterns = [
        r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
        r'experience\s*[:\-]?\s*(\d+)\s*years?',
        r'(\d+)\s*years?\s*(?:of\s*)?(?:professional|work)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))

    year_pattern = r'20\d{2}\s*[-–]\s*(20\d{2}|present|current)'
    years = re.findall(year_pattern, text.lower())
    if years:
        return min(len(years) * 2, 15)

    return 0


def extract_education(text: str) -> str:
    degrees = [
        r"(ph\.?d\.?|doctorate)",
        r"(master'?s?|m\.?s\.?|m\.?tech|mba)",
        r"(bachelor'?s?|b\.?s\.?|b\.?tech|b\.?e\.?)",
    ]

    for pattern in degrees:
        if re.search(pattern, text.lower()):
            match = re.search(pattern, text.lower())
            return match.group(0).upper()

    return ""


def extract_contact_info(text: str) -> Dict[str, str]:
    email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
    phone_pattern = r'[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3,6}[-\s\.]?[0-9]{3,6}'
    linkedin_pattern = r'linkedin\.com/in/[\w\-]+'
    github_pattern = r'github\.com/[\w\-]+'

    return {
        "email": re.search(email_pattern, text).group(0) if re.search(email_pattern, text) else "",
        "phone": re.search(phone_pattern, text).group(0) if re.search(phone_pattern, text) else "",
        "linkedin": re.search(linkedin_pattern, text).group(0) if re.search(linkedin_pattern, text) else "",
        "github": re.search(github_pattern, text).group(0) if re.search(github_pattern, text) else ""
    }


async def match_resume_to_job(candidate, job) -> Dict[str, Any]:
    candidate_skills = set(s.lower() for s in (candidate.skills or []))
    required_skills = set(s.lower() for s in (job.required_skills or []))

    if required_skills:
        matched_skills = candidate_skills & required_skills
        missing_skills = required_skills - candidate_skills
        skill_match = (len(matched_skills) / len(required_skills)) * 100
    else:
        matched_skills = candidate_skills
        missing_skills = set()
        skill_match = 50

    exp_min = job.experience_min or 0
    exp_max = job.experience_max or 20
    candidate_exp = candidate.experience_years or 0

    if exp_min <= candidate_exp <= exp_max:
        experience_match = 100
    elif candidate_exp < exp_min:
        experience_match = max(0, 100 - (exp_min - candidate_exp) * 15)
    else:
        experience_match = max(50, 100 - (candidate_exp - exp_max) * 5)

    overall_score = (skill_match * 0.7) + (experience_match * 0.3)

    return {
        "overall_score": round(overall_score, 1),
        "skill_match": round(skill_match, 1),
        "experience_match": round(experience_match, 1),
        "matched_skills": list(matched_skills),
        "missing_skills": list(missing_skills)
    }
