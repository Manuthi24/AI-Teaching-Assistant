from fastapi import APIRouter, HTTPException, Depends
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
from dotenv import load_dotenv

from app.auth.schemas import GoogleLoginRequest
from app.auth.service import (
    fake_users_db,
    create_access_token,
    find_user_by_email
)
from app.auth.dependencies import get_current_user as auth_current_user

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
def get_me(current_user: dict = Depends(auth_current_user)):
    return {
        "name": current_user["name"],
        "email": current_user["email"],
        "picture": current_user.get("picture"),
        "role": current_user["role"]
    }


@router.get("/stats")
def get_user_stats(current_user: dict = Depends(auth_current_user)):
    total_users = len(fake_users_db)

    total_teachers = 0
    total_students = 0

    for user in fake_users_db:
        if user["role"] == "teacher":
            total_teachers += 1
        elif user["role"] == "student":
            total_students += 1

    return {
        "total_users": total_users,
        "total_teachers": total_teachers,
        "total_students": total_students
    }