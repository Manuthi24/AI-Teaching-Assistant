from jose import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from app.database import get_database

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "temporary_secret_key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


def get_users_collection():
    db = get_database()
    return db["users"]


async def find_user_by_email(email: str):
    users_collection = get_users_collection()
    user = await users_collection.find_one({"email": email})

    if user:
        user["_id"] = str(user["_id"])

    return user


async def create_or_update_google_user(
    email: str,
    name: str,
    picture: str,
    google_id: str,
    role: str
):
    users_collection = get_users_collection()

    existing_user = await users_collection.find_one({"email": email})

    user_data = {
        "name": name,
        "email": email,
        "picture": picture,
        "google_id": google_id,
        "role": role,
        "auth_provider": "google",
        "updated_at": datetime.utcnow().isoformat()
    }

    if existing_user:
        await users_collection.update_one(
            {"email": email},
            {"$set": user_data}
        )
    else:
        user_data["created_at"] = datetime.utcnow().isoformat()

        await users_collection.insert_one(user_data)

    user = await users_collection.find_one({"email": email})
    user["_id"] = str(user["_id"])

    return user


async def get_user_stats_from_db():
    users_collection = get_users_collection()

    total_users = await users_collection.count_documents({})
    total_teachers = await users_collection.count_documents({"role": "teacher"})
    total_students = await users_collection.count_documents({"role": "student"})

    return {
        "total_users": total_users,
        "total_teachers": total_teachers,
        "total_students": total_students
    }