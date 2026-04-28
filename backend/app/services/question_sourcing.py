"""
Source interview questions from the live web (gpt-5.4-mini + hosted web_search)
with a generation-only fallback. Caches by (role, company) for 14 days.
"""
import json
import re
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional, Tuple
from urllib.parse import urlparse

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.question import Difficulty, Question, QuestionType
from app.models.question_cache import QuestionCache


CACHE_TTL = timedelta(days=14)
MODEL = "gpt-5.4-mini"
VALID_TYPES = {qt.value for qt in QuestionType}
VALID_DIFFS = {d.value for d in Difficulty}

client: Optional[OpenAI] = None
if settings.OPENAI_API_KEY:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)


def _norm(s: Optional[str]) -> str:
    return (s or "").strip().lower()


# Match either "([label](url))" or "[label](url)" markdown citations the LLM
# appends to the question text. Captures the URL.
_CITATION_RE = re.compile(r"\s*\(?\[[^\]]+\]\((https?://[^)]+)\)\)?")


def _extract_citation(text: str) -> Tuple[str, Optional[str]]:
    """Return (clean_text, first_url) — strip ALL inline markdown citations."""
    first: Optional[str] = None

    def take(m: re.Match[str]) -> str:
        nonlocal first
        if first is None:
            url = m.group(1)
            # Drop tracking params for a cleaner stored URL
            first = url.split("?utm_")[0].split("&utm_")[0]
        return ""

    cleaned = _CITATION_RE.sub(take, text).strip()
    # Sometimes the model leaves trailing punctuation behind after we strip
    cleaned = re.sub(r"\s+([?!.])", r"\1", cleaned)
    cleaned = cleaned.rstrip(" .,;")
    if cleaned and not cleaned.endswith(("?", ".", "!")):
        cleaned += "?" if cleaned[0:1].isupper() and " " in cleaned else "."
    return cleaned, first


def _domain_of(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    try:
        host = urlparse(url).hostname or ""
        return host.removeprefix("www.") or None
    except Exception:  # noqa: BLE001
        return None


def _sentinel_role(role: str, company: Optional[str]) -> str:
    return f"sourced:{_norm(role)}:{_norm(company) or '_'}"


def _question_schema(num: int) -> dict:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "questions": {
                "type": "array",
                "minItems": 1,
                "maxItems": max(num + 5, 12),
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "question_text",
                        "question_type",
                        "difficulty",
                        "topic",
                        "source_url",
                        "time_limit_minutes",
                    ],
                    "properties": {
                        "question_text": {
                            "type": "string",
                            "minLength": 8,
                            "description": "Plain question text only — DO NOT include any markdown citations like ([source](url)). The source URL goes in the source_url field.",
                        },
                        "question_type": {"type": "string", "enum": list(VALID_TYPES)},
                        "difficulty": {"type": "string", "enum": list(VALID_DIFFS)},
                        "topic": {"type": "string"},
                        "source_url": {
                            "type": "string",
                            "description": "Full URL of the public page this question was sourced from. Empty string if generated.",
                        },
                        "time_limit_minutes": {"type": "integer", "minimum": 3, "maximum": 30},
                    },
                },
            }
        },
        "required": ["questions"],
    }


def _build_search_prompt(
    role: str, company: str, jd: Optional[str], categories: Optional[List[str]], num: int
) -> str:
    cats = ", ".join(categories) if categories else "technical, behavioral, coding"
    jd_block = f"\n\nJOB DESCRIPTION:\n{jd.strip()[:2000]}" if jd and jd.strip() else ""
    return (
        f"You are sourcing real interview questions a candidate would face when "
        f"interviewing at {company} for a {role} role. Use the web_search tool to "
        f"find recent (last 24 months) questions reported on Glassdoor, Blind, "
        f"leetcode discuss threads, and the company's own engineering blog or "
        f"careers page.\n\n"
        f"Return exactly {num} questions, balanced across these categories: {cats}.\n"
        f"Skip generic filler like 'tell me about yourself' or 'what's your weakness'. "
        f"Prefer questions specific to {company}'s stack, products, or known interview style.\n"
        f"For coding/system_design, lift the actual question text where possible."
        f"{jd_block}"
    )


def _build_generate_prompt(
    role: str, company: Optional[str], jd: Optional[str], categories: Optional[List[str]], num: int
) -> str:
    cats = ", ".join(categories) if categories else "technical, behavioral, coding"
    company_block = f" at {company}" if company else ""
    jd_block = f"\n\nJOB DESCRIPTION:\n{jd.strip()[:2000]}" if jd and jd.strip() else ""
    return (
        f"You are an experienced technical interviewer designing a {num}-question "
        f"interview for a {role} role{company_block}.\n"
        f"Distribute the questions across these categories: {cats}.\n"
        f"Match difficulty to the seniority implied by the role and JD. Skip generic "
        f"filler like 'tell me about yourself'.{jd_block}\n\n"
        f"Return {num} questions only — no preamble."
    )


async def _call_responses(prompt: str, num: int, with_search: bool) -> Optional[List[dict]]:
    """Single Responses API call. Returns list of question dicts or None on failure."""
    if client is None:
        return None
    try:
        kwargs: dict[str, Any] = {
            "model": MODEL,
            "input": prompt,
            "reasoning": {"effort": "low"},
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "questions",
                    "schema": _question_schema(num),
                    "strict": True,
                }
            },
        }
        if with_search:
            kwargs["tools"] = [{"type": "web_search"}]

        resp = client.responses.create(**kwargs)  # type: ignore[arg-type]
        text = getattr(resp, "output_text", None) or ""
        if not text:
            return None
        data = json.loads(text)
        items = data.get("questions") or []
        return [it for it in items if isinstance(it, dict) and it.get("question_text")]
    except Exception as e:  # noqa: BLE001
        print(f"[question_sourcing] {'web' if with_search else 'gen'} call failed: {e}")
        return None


def _persist_questions(
    db: Session, role: str, company: Optional[str], items: List[dict]
) -> List[Question]:
    sentinel = _sentinel_role(role, company)
    created: List[Question] = []
    for it in items:
        try:
            qt = QuestionType(it.get("question_type") or "technical")
        except ValueError:
            qt = QuestionType.TECHNICAL
        try:
            diff = Difficulty(it.get("difficulty") or "medium")
        except ValueError:
            diff = Difficulty.MEDIUM
        time_limit = int(it.get("time_limit_minutes") or 5)
        time_limit = max(3, min(30, time_limit))

        raw_text = str(it.get("question_text") or "")
        clean_text, citation_url = _extract_citation(raw_text)
        # Prefer an explicit source_url field if the model provided one
        explicit = (it.get("source_url") or "").strip() or None
        source_url = explicit or citation_url

        q = Question(
            role=sentinel,
            company=(company or None),
            difficulty=diff,
            question_type=qt,
            topic=(it.get("topic") or "")[:200],
            question_text=clean_text[:2000],
            source_url=(source_url[:500] if source_url else None),
            time_limit_minutes=time_limit,
        )
        db.add(q)
        created.append(q)
    db.flush()
    return created


def _write_cache(
    db: Session, role: str, company: Optional[str], question_ids: List[int]
) -> None:
    row = QuestionCache(
        role=_norm(role),
        company=_norm(company),
        question_ids_json=json.dumps(question_ids),
        fetched_at=datetime.now(timezone.utc),
    )
    db.add(row)
    db.flush()


def _cache_lookup(
    db: Session, role: str, company: Optional[str]
) -> Optional[List[Question]]:
    row = (
        db.query(QuestionCache)
        .filter(
            QuestionCache.role == _norm(role),
            QuestionCache.company == _norm(company),
        )
        .order_by(QuestionCache.fetched_at.desc())
        .first()
    )
    if not row:
        return None
    fetched = row.fetched_at
    if fetched.tzinfo is None:
        fetched = fetched.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) - fetched > CACHE_TTL:
        return None
    try:
        ids = json.loads(row.question_ids_json or "[]")
    except json.JSONDecodeError:
        return None
    if not ids:
        return None
    qs = db.query(Question).filter(Question.id.in_(ids)).all()
    if len(qs) < len(ids) // 2:  # too many missing — refetch
        return None
    # preserve original order
    by_id = {q.id: q for q in qs}
    return [by_id[i] for i in ids if i in by_id]


async def source_questions(
    *,
    role: str,
    company: Optional[str],
    jd: Optional[str],
    num: int,
    categories: Optional[List[str]],
    db: Session,
) -> List[Question]:
    """Return Question rows (already added to the session) for an interview.

    Strategy: cache → web_search (if company) → generation-only → []. The caller
    is responsible for committing the session and falling back further if [].
    """
    if num <= 0:
        return []

    cached = _cache_lookup(db, role, company)
    if cached:
        return cached[:num]

    items: List[dict] = []
    has_company = bool(_norm(company))

    if has_company and client is not None:
        items = await _call_responses(
            _build_search_prompt(role, company or "", jd, categories, num),
            num=num,
            with_search=True,
        ) or []

    if len(items) < 3:
        gen = await _call_responses(
            _build_generate_prompt(role, company, jd, categories, num),
            num=num,
            with_search=False,
        ) or []
        items = gen if len(gen) > len(items) else items

    if not items:
        return []

    items = items[:num]
    questions = _persist_questions(db, role, company, items)
    _write_cache(db, role, company, [q.id for q in questions])
    return questions
