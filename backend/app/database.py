import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import AsyncMongoClient

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "ai_teaching_assistant")

client = None
database = None


async def connect_to_mongo():
    global client, database

    if not MONGODB_URI:
        raise ValueError("MONGODB_URI is missing in backend/.env")

    client = AsyncMongoClient(MONGODB_URI)
    database = client[MONGODB_DB_NAME]

    await client.admin.command("ping")
    print("MongoDB connected successfully")


async def close_mongo_connection():
    global client

    if client:
        await client.close()
        print("MongoDB connection closed")


def get_database():
    if database is None:
        raise RuntimeError("Database is not connected")

    return database