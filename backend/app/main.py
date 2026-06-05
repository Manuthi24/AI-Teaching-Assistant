from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import connect_to_mongo, close_mongo_connection, get_database

from app.auth.routes import router as auth_router
from app.documents.routes import router as documents_router
from app.chat.routes import router as chat_router
from app.quiz.routes import router as quiz_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="AI Teaching Assistant API",
    description="Backend API for RAG-based AI Teaching Assistant",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(quiz_router)


@app.get("/")
def home():
    return {"message": "AI Teaching Assistant Backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/db-check")
async def db_check():
    db = get_database()
    collections = await db.list_collection_names()

    return {
        "message": "MongoDB connected successfully",
        "database": db.name,
        "collections": collections
    }