import io
from typing import Optional
from openai import OpenAI

from app.core.config import settings

client = None
if settings.OPENAI_API_KEY:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)


async def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    if not client:
        raise RuntimeError("OPENAI_API_KEY not configured; cannot transcribe audio.")

    buffer = io.BytesIO(audio_bytes)
    buffer.name = filename or "audio.webm"

    response = client.audio.transcriptions.create(
        model="whisper-1",
        file=buffer,
    )
    return response.text.strip()


async def generate_follow_up(question_text: str, answer_text: str) -> Optional[str]:
    """Generate a single probing follow-up question, or None if the answer doesn't warrant one."""
    if not client:
        return None
    if not answer_text or len(answer_text.strip()) < 20:
        return None

    prompt = f"""You are a senior technical interviewer. A candidate just answered this question:

QUESTION: {question_text}

ANSWER: {answer_text}

Decide whether a single probing follow-up question would meaningfully deepen the conversation.
- If the answer was strong and complete, or too short/off-topic to build on, respond with exactly: NONE
- Otherwise, respond with ONE concise follow-up question (max 25 words) that digs into a gap, asks for a concrete example, or probes a trade-off they mentioned.

Respond with ONLY the question text, or exactly NONE. No preamble."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=80,
        )
        text = response.choices[0].message.content.strip()
        if not text or text.upper().startswith("NONE"):
            return None
        return text.strip('"').strip()
    except Exception as e:
        print(f"Follow-up generation failed: {e}")
        return None
