import base64
import json
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt as jose_jwt
from sqlalchemy.orm import Session

from app.api.deps import security as bearer_scheme
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, decode_token
from app.models.user import User, UserRole
from app.models.candidate import Candidate
from app.services.workos_client import workos_client

router = APIRouter()


# ---------- WorkOS AuthKit (hosted) ----------

def _encode_state(role: str) -> str:
    payload = {"role": role, "nonce": secrets.token_urlsafe(8)}
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")


def _decode_state(state: str) -> dict:
    if not state:
        return {}
    try:
        padded = state + "=" * (-len(state) % 4)
        return json.loads(base64.urlsafe_b64decode(padded.encode()))
    except Exception:
        return {}


def _extract_session_id(workos_access_token: str) -> Optional[str]:
    try:
        claims = jose_jwt.get_unverified_claims(workos_access_token)
        sid = claims.get("sid")
        return sid if isinstance(sid, str) else None
    except Exception:
        return None


def _redirect_to_frontend_with_error(message: str) -> RedirectResponse:
    encoded = base64.urlsafe_b64encode(message.encode()).decode().rstrip("=")
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/auth/workos-callback#error={encoded}",
        status_code=status.HTTP_302_FOUND,
    )


@router.get("/workos/login")
async def workos_login(role: str = Query("candidate")):
    if workos_client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="WorkOS is not configured on this server."
        )

    desired_role = role if role in {"candidate", "recruiter"} else "candidate"
    state = _encode_state(desired_role)

    url = workos_client.user_management.get_authorization_url(
        provider="authkit",
        redirect_uri=settings.WORKOS_REDIRECT_URI,
        state=state,
        prompt="login",
    )
    return RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)


@router.get("/workos/callback")
async def workos_callback(
    code: str = Query(...),
    state: str = Query(""),
    db: Session = Depends(get_db),
):
    if workos_client is None:
        return _redirect_to_frontend_with_error("WorkOS is not configured on this server.")

    try:
        result = await workos_client.user_management.authenticate_with_code(
            code=code,
        )
    except Exception as e:  # noqa: BLE001
        return _redirect_to_frontend_with_error(f"WorkOS auth failed: {e}")

    workos_user = result.user
    email = (workos_user.email or "").lower().strip()
    if not email:
        return _redirect_to_frontend_with_error("WorkOS returned a user without an email.")

    desired_role_str = _decode_state(state).get("role") or "candidate"
    if desired_role_str not in {"candidate", "recruiter"}:
        desired_role_str = "candidate"
    desired_role = UserRole(desired_role_str)

    user = db.query(User).filter(User.email == email).first()
    if not user:
        full_name = " ".join(
            part for part in [workos_user.first_name, workos_user.last_name] if part
        ).strip() or email.split("@")[0]
        user = User(
            email=email,
            hashed_password="",
            full_name=full_name,
            role=desired_role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        if user.role == UserRole.CANDIDATE:
            db.add(Candidate(user_id=user.id))
            db.commit()

    wos_sid = _extract_session_id(result.access_token)
    token_claims: dict = {"sub": str(user.id), "role": user.role.value}
    if wos_sid:
        token_claims["wos_sid"] = wos_sid

    access_token = create_access_token(data=token_claims)

    user_payload = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
    user_b64 = base64.urlsafe_b64encode(json.dumps(user_payload).encode()).decode().rstrip("=")

    target = f"{settings.FRONTEND_URL}/auth/workos-callback#token={access_token}&user={user_b64}"
    return RedirectResponse(url=target, status_code=status.HTTP_302_FOUND)


@router.get("/workos/logout")
async def workos_logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    """Return a WorkOS hosted sign-out URL the frontend can navigate to.

    The frontend always clears its own state regardless of this response;
    a `null` logout_url just means we couldn't talk to WorkOS this round.
    """
    if workos_client is None:
        return {"logout_url": None}

    payload = decode_token(credentials.credentials)
    if not payload:
        return {"logout_url": None}

    wos_sid = payload.get("wos_sid")
    if not wos_sid:
        return {"logout_url": None}

    try:
        # Don't pass return_to — let WorkOS redirect to the default Sign-out
        # URI configured in the dashboard. Passing an unregistered return_to
        # makes WorkOS render its "Couldn't sign in" error page.
        url = workos_client.user_management.get_logout_url(
            session_id=wos_sid,
        )
    except Exception:  # noqa: BLE001
        return {"logout_url": None}

    return {"logout_url": url}
