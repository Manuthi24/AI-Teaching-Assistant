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


def get_documents_collection():
    db = get_database()
    return db["documents"]


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

    selected_document = None

    if request.document_id:
        documents_collection = get_documents_collection()

        selected_document = await documents_collection.find_one(
            {"id": request.document_id},
            {"_id": 0}
        )

        if not selected_document:
            raise HTTPException(
                status_code=404,
                detail="Selected document not found"
            )

    relevant_chunks = search_similar_chunks(
        question=request.question,
        top_k=3,
        document_id=request.document_id
    )

    if not relevant_chunks:
        return {
            "question": request.question,
            "answer": "I could not find relevant information in the selected study material.",
            "sources": [],
            "source_document_id": request.document_id,
            "source_document_title": selected_document["title"] if selected_document else "All uploaded documents",
            "created_at": datetime.utcnow().isoformat()
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
        "source_document_id": request.document_id,
        "source_document_title": selected_document["title"] if selected_document else "All uploaded documents",
        "created_at": datetime.utcnow().isoformat()
    }

    chats_collection = get_chats_collection()
    await chats_collection.insert_one(chat_record)

    return {
        "question": request.question,
        "answer": answer,
        "sources": relevant_chunks,
        "source_document_id": chat_record["source_document_id"],
        "source_document_title": chat_record["source_document_title"],
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