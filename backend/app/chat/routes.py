from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.auth.dependencies import require_student
from app.chat.schemas import ChatRequest
from app.embeddings.pinecone_service import search_similar_chunks
from app.llm.groq_service import generate_rag_answer

router = APIRouter(prefix="/chat", tags=["Chat"])

chat_history_db = []


@router.post("/ask")
def ask_question(
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

    chat_history_db.append(chat_record)

    return {
        "question": request.question,
        "answer": answer,
        "sources": relevant_chunks,
        "created_at": chat_record["created_at"]
    }


@router.get("/history")
def get_chat_history(current_user: dict = Depends(require_student)):
    student_history = []

    for chat in chat_history_db:
        if chat["student_email"] == current_user["email"]:
            student_history.append(chat)

    return {
        "history": student_history
    }