from typing import Dict, List

ROLE_TOPICS = {
    "SDE": {
        "topics": ["Data Structures", "Algorithms", "System Design", "OOP", "Database", "OS"],
        "focus": "Problem-solving and coding skills",
        "question_distribution": {"coding": 40, "technical": 30, "system_design": 20, "behavioral": 10}
    },
    "ML Engineer": {
        "topics": ["Machine Learning", "Deep Learning", "Statistics", "Python", "Data Processing", "MLOps"],
        "focus": "ML concepts and practical implementation",
        "question_distribution": {"technical": 40, "case_study": 30, "coding": 20, "behavioral": 10}
    },
    "Data Scientist": {
        "topics": ["Statistics", "Machine Learning", "SQL", "Python", "Data Visualization", "A/B Testing"],
        "focus": "Data analysis and ML application",
        "question_distribution": {"technical": 35, "case_study": 35, "coding": 20, "behavioral": 10}
    },
    "Frontend Developer": {
        "topics": ["JavaScript", "React", "CSS", "HTML", "Web Performance", "Accessibility"],
        "focus": "UI/UX and frontend technologies",
        "question_distribution": {"technical": 40, "coding": 35, "system_design": 15, "behavioral": 10}
    },
    "Backend Developer": {
        "topics": ["API Design", "Database", "System Design", "Security", "Caching", "Microservices"],
        "focus": "Server-side development and architecture",
        "question_distribution": {"technical": 35, "coding": 30, "system_design": 25, "behavioral": 10}
    },
    "DevOps Engineer": {
        "topics": ["CI/CD", "Docker", "Kubernetes", "Cloud", "Monitoring", "Infrastructure as Code"],
        "focus": "Infrastructure and deployment automation",
        "question_distribution": {"technical": 45, "system_design": 30, "behavioral": 15, "coding": 10}
    },
    "Product Manager": {
        "topics": ["Product Strategy", "User Research", "Metrics", "Roadmap", "Stakeholder Management"],
        "focus": "Product thinking and business impact",
        "question_distribution": {"behavioral": 40, "case_study": 40, "technical": 20}
    }
}

COMPANY_PATTERNS = {
    "Amazon": {
        "style": "Leadership Principles focused, STAR format",
        "focus": ["Customer Obsession", "Ownership", "Bias for Action", "Deep Dive"],
        "difficulty_bias": "hard",
        "technical_depth": "high",
        "behavioral_weight": 0.4
    },
    "Google": {
        "style": "Problem-solving focused, ambiguous problems",
        "focus": ["Analytical thinking", "Scalability", "Innovation", "Googleyness"],
        "difficulty_bias": "hard",
        "technical_depth": "very_high",
        "behavioral_weight": 0.2
    },
    "Microsoft": {
        "style": "Balanced technical and behavioral",
        "focus": ["Growth Mindset", "Collaboration", "Customer Impact"],
        "difficulty_bias": "medium",
        "technical_depth": "high",
        "behavioral_weight": 0.3
    },
    "Meta": {
        "style": "Move fast, coding heavy",
        "focus": ["Coding Excellence", "Impact", "Bold Decisions"],
        "difficulty_bias": "hard",
        "technical_depth": "very_high",
        "behavioral_weight": 0.2
    },
    "Apple": {
        "style": "Design and detail oriented",
        "focus": ["Attention to Detail", "User Experience", "Innovation"],
        "difficulty_bias": "hard",
        "technical_depth": "high",
        "behavioral_weight": 0.3
    },
    "Netflix": {
        "style": "Culture fit and senior judgment",
        "focus": ["Freedom & Responsibility", "Context not Control", "High Performance"],
        "difficulty_bias": "hard",
        "technical_depth": "high",
        "behavioral_weight": 0.35
    },
    "Startup": {
        "style": "Practical, fast-paced, versatile",
        "focus": ["Adaptability", "Full-stack thinking", "Initiative"],
        "difficulty_bias": "medium",
        "technical_depth": "medium",
        "behavioral_weight": 0.25
    }
}


def get_role_config(role: str) -> Dict:
    for key in ROLE_TOPICS:
        if key.lower() in role.lower() or role.lower() in key.lower():
            return ROLE_TOPICS[key]
    return ROLE_TOPICS.get("SDE")


def get_company_config(company: str) -> Dict:
    if not company:
        return COMPANY_PATTERNS.get("Startup")
    for key in COMPANY_PATTERNS:
        if key.lower() in company.lower() or company.lower() in key.lower():
            return COMPANY_PATTERNS[key]
    return COMPANY_PATTERNS.get("Startup")


def get_difficulty_weights(company_config: Dict) -> Dict[str, float]:
    bias = company_config.get("difficulty_bias", "medium")
    if bias == "hard":
        return {"easy": 0.2, "medium": 0.4, "hard": 0.4}
    elif bias == "very_hard":
        return {"easy": 0.1, "medium": 0.3, "hard": 0.6}
    else:
        return {"easy": 0.3, "medium": 0.5, "hard": 0.2}


def calculate_level_thresholds(company: str) -> Dict[str, Dict[str, float]]:
    company_config = get_company_config(company)
    base_thresholds = {
        "Entry Level / Junior": {"min": 0, "max": 50},
        "SDE-1 / Associate": {"min": 50, "max": 65},
        "SDE-2 / Mid-Level": {"min": 65, "max": 80},
        "Senior / SDE-3": {"min": 80, "max": 90},
        "Staff / Principal": {"min": 90, "max": 100}
    }

    if company_config.get("technical_depth") == "very_high":
        for level in base_thresholds:
            base_thresholds[level]["min"] = min(base_thresholds[level]["min"] + 5, 100)
            base_thresholds[level]["max"] = min(base_thresholds[level]["max"] + 5, 100)

    return base_thresholds
