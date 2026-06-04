from fastapi import APIRouter, HTTPException, Header
from jose import jwt, JWTError
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
from dotenv import load_dotenv

from app.auth.schemas import GoogleLoginRequest
from app.auth.service import (
    fake_users_db,
    create_access_token,
    find_user_by_email,
    SECRET_KEY,
    ALGORITHM
)

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


@router.post("/google-login")
def google_login(request: GoogleLoginRequest):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google Client ID is not configured in backend .env"
        )

    try:
        id_info = id_token.verify_oauth2_token(
            request.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = id_info.get("email")
        name = id_info.get("name")
        picture = id_info.get("picture")
        google_id = id_info.get("sub")

        if not email:
            raise HTTPException(
                status_code=400,
                detail="Google account email not found"
            )

        user = find_user_by_email(email)

        if not user:
            user = {
                "name": name,
                "email": email,
                "picture": picture,
                "google_id": google_id,
                "role": request.role,
                "auth_provider": "google"
            }

            fake_users_db.append(user)

        else:
            user["name"] = name
            user["picture"] = picture
            user["google_id"] = google_id
            user["role"] = request.role

        access_token = create_access_token(
            data={
                "sub": user["email"],
                "role": user["role"]
            }
        )

        return {
            "message": "Google login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "name": user["name"],
                "email": user["email"],
                "picture": user.get("picture"),
                "role": user["role"]
            }
        }

    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Google token"
        )


@router.get("/me")
def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing"
        )

    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        email = payload.get("sub")

        if not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid token payload"
            )

        user = find_user_by_email(email)

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        return {
            "name": user["name"],
            "email": user["email"],
            "picture": user.get("picture"),
            "role": user["role"]
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )