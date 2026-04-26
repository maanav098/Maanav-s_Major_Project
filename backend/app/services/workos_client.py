from typing import Optional

from app.core.config import settings

try:
    from workos import AsyncWorkOSClient
except ImportError:
    AsyncWorkOSClient = None  # type: ignore


def _build_client() -> Optional["AsyncWorkOSClient"]:
    if AsyncWorkOSClient is None:
        return None
    if not settings.WORKOS_API_KEY or not settings.WORKOS_CLIENT_ID:
        return None
    return AsyncWorkOSClient(
        api_key=settings.WORKOS_API_KEY,
        client_id=settings.WORKOS_CLIENT_ID,
    )


workos_client = _build_client()


def is_configured() -> bool:
    return workos_client is not None
