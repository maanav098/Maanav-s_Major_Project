from typing import Optional
import httpx

from app.core.config import settings


async def run_code(
    language: str,
    version: str,
    source: str,
    stdin: str = "",
) -> dict:
    payload = {
        "language": language,
        "version": version,
        "files": [{"content": source}],
        "stdin": stdin,
    }

    url = f"{settings.PISTON_URL.rstrip('/')}/api/v2/execute"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, json=payload)
    except httpx.TimeoutException:
        return {"stdout": "", "stderr": "", "exitCode": None, "error": "Execution timed out"}
    except httpx.HTTPError as e:
        return {"stdout": "", "stderr": "", "exitCode": None, "error": f"Runner unreachable: {e}"}

    if res.status_code != 200:
        return {
            "stdout": "",
            "stderr": "",
            "exitCode": None,
            "error": f"Runner error ({res.status_code}): {res.text[:200]}",
        }

    data = res.json()
    run = data.get("run", {}) or {}
    compile_ = data.get("compile", {}) or {}

    exit_code: Optional[int] = run.get("code") if isinstance(run.get("code"), int) else None

    return {
        "stdout": run.get("stdout", ""),
        "stderr": run.get("stderr") or compile_.get("stderr", ""),
        "exitCode": exit_code,
    }
