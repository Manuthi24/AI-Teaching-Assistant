from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.auth.dependencies import require_student
from app.chat.schemas import ChatRequest
from app.embeddings.pinecone_service import search_similar_chunks
from app.llm.groq_service import generate_rag_answer
from app.database import get_database

router = APIRouter(prefix="/chat", tags=["Chat"])


def get_chats_collection():
    db = get_database()
    return db["chats"]


@router.post("/ask")
async def ask_question(
    request: ChatRequest,
    current_user: dict = Depends(require_student)
):
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )

    relevant_chunks = search_similar_chunks(request.question, top_k=3)

    if not relevant_chunks:
        return {
            "answer": "I could not find relevant information in the uploaded study materials.",
            "sources": []
        }

    answer = generate_rag_answer(
        question=request.question,
        context_chunks=relevant_chunks
    )

    chat_record = {
        "student_email": current_user["email"],
        "student_name": current_user["name"],
        "question": request.question,
        "answer": answer,
        "sources": relevant_chunks,
        "created_at": datetime.utcnow().isoformat()
    }

    chats_collection = get_chats_collection()
    await chats_collection.insert_one(chat_record)

    return {
        "question": request.question,
        "answer": answer,
        "sources": relevant_chunks,
        "created_at": chat_record["created_at"]
    }


@router.get("/history")
async def get_chat_history(current_user: dict = Depends(require_student)):
    chats_collection = get_chats_collection()

    history = []

    cursor = (
        chats_collection
        .find(
            {"student_email": current_user["email"]},
            {"_id": 0}
        )
        .sort("created_at", -1)
    )

    async for chat in cursor:
        history.append(chat)

    return {
        "history": history
    }