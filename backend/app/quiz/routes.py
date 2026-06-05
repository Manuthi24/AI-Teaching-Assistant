from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from uuid import uuid4

from app.auth.dependencies import require_teacher, require_student, get_current_user
from app.quiz.schemas import (
    QuizGenerateRequest,
    QuizSubmitRequest,
    QuizUpdateRequest
)
from app.embeddings.pinecone_service import search_similar_chunks
from app.llm.groq_service import generate_quiz_questions
from app.database import get_database

router = APIRouter(prefix="/quiz", tags=["Quiz"])


def get_quizzes_collection():
    db = get_database()
    return db["quizzes"]


def get_quiz_attempts_collection():
    db = get_database()
    return db["quiz_attempts"]


def remove_correct_answers(quiz: dict):
    safe_questions = []

    for question in quiz["questions"]:
        safe_questions.append({
            "id": question["id"],
            "question": question["question"],
            "options": question["options"]
        })

    return {
        "id": quiz["id"],
        "title": quiz["title"],
        "topic": quiz["topic"],
        "num_questions": len(quiz["questions"]),
        "questions": safe_questions,
        "created_by": quiz.get("created_by"),
        "created_at": quiz.get("created_at"),
        "source_document_id": quiz.get("source_document_id"),
        "source_document_title": quiz.get(
            "source_document_title",
            "All uploaded documents"
        )
    }


@router.post("/generate")
async def generate_quiz(
    request: QuizGenerateRequest,
    current_user: dict = Depends(require_teacher)
):
    documents_collection = get_database()["documents"]

    selected_document = None

    if request.document_id:
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
        request.topic,
        top_k=6,
        document_id=request.document_id
    )

    if not relevant_chunks:
        raise HTTPException(
            status_code=404,
            detail="No relevant study material found for this topic in the selected document"
        )

    try:
        quiz_data = generate_quiz_questions(
            topic=request.topic,
            context_chunks=relevant_chunks,
            num_questions=request.num_questions
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Quiz generation failed: {str(e)}"
        )

    questions = quiz_data.get("questions", [])

    if not questions:
        raise HTTPException(
            status_code=500,
            detail="Quiz generation failed: No questions returned by AI"
        )

    quiz_id = str(uuid4())
    created_at = datetime.utcnow().isoformat()

    quiz = {
        "id": quiz_id,
        "title": quiz_data.get("title", f"Quiz on {request.topic}"),
        "topic": request.topic,
        "questions": questions,
        "source_document_id": request.document_id,
        "source_document_title": selected_document["title"] if selected_document else "All uploaded documents",
        "created_by": current_user["email"],
        "created_by_name": current_user["name"],
        "created_at": created_at
    }

    quizzes_collection = get_quizzes_collection()
    await quizzes_collection.insert_one(quiz.copy())

    return {
        "message": "Quiz generated successfully",
        "quiz": quiz
    }


@router.get("/")
async def get_quizzes(current_user: dict = Depends(get_current_user)):
    quizzes_collection = get_quizzes_collection()

    quiz_list = []

    cursor = quizzes_collection.find({}, {"_id": 0}).sort("created_at", -1)

    async for quiz in cursor:
        quiz_list.append({
            "id": quiz["id"],
            "title": quiz["title"],
            "topic": quiz["topic"],
            "num_questions": len(quiz["questions"]),
            "created_by_name": quiz.get("created_by_name", "Unknown"),
            "created_at": quiz.get("created_at"),
            "source_document_id": quiz.get("source_document_id"),
            "source_document_title": quiz.get(
                "source_document_title",
                "All uploaded documents"
            )
        })

    return {
        "quizzes": quiz_list
    }


@router.get("/attempts/history")
async def get_attempt_history(current_user: dict = Depends(require_student)):
    attempts_collection = get_quiz_attempts_collection()

    history = []

    cursor = (
        attempts_collection
        .find(
            {"student_email": current_user["email"]},
            {"_id": 0}
        )
        .sort("created_at", -1)
    )

    async for attempt in cursor:
        history.append(attempt)

    return {
        "history": history
    }


@router.get("/attempts/all")
async def get_all_attempts(current_user: dict = Depends(require_teacher)):
    attempts_collection = get_quiz_attempts_collection()

    attempts = []

    cursor = (
        attempts_collection
        .find({}, {"_id": 0})
        .sort("created_at", -1)
    )

    async for attempt in cursor:
        attempts.append(attempt)

    return {
        "attempts": attempts
    }


@router.get("/{quiz_id}")
async def get_quiz(
    quiz_id: str,
    current_user: dict = Depends(get_current_user)
):
    quizzes_collection = get_quizzes_collection()

    quiz = await quizzes_collection.find_one(
        {"id": quiz_id},
        {"_id": 0}
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found"
        )

    if current_user["role"] == "student":
        return {
            "quiz": remove_correct_answers(quiz)
        }

    return {
        "quiz": quiz
    }


@router.put("/{quiz_id}")
async def update_quiz(
    quiz_id: str,
    request: QuizUpdateRequest,
    current_user: dict = Depends(require_teacher)
):
    quizzes_collection = get_quizzes_collection()

    quiz = await quizzes_collection.find_one(
        {"id": quiz_id},
        {"_id": 0}
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found"
        )

    updated_questions = []

    for question in request.questions:
        cleaned_options = [option.strip() for option in question.options]

        if any(option == "" for option in cleaned_options):
            raise HTTPException(
                status_code=400,
                detail=f"Options cannot be empty for question {question.id}"
            )

        if question.correct_option_index < 0 or question.correct_option_index >= len(cleaned_options):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid correct option index for question {question.id}"
            )

        updated_questions.append({
            "id": question.id,
            "question": question.question.strip(),
            "options": cleaned_options,
            "correct_option_index": question.correct_option_index,
            "explanation": question.explanation.strip()
        })

    updated_data = {
        "title": request.title.strip(),
        "topic": request.topic.strip(),
        "questions": updated_questions,
        "updated_by": current_user["email"],
        "updated_by_name": current_user["name"],
        "updated_at": datetime.utcnow().isoformat()
    }

    await quizzes_collection.update_one(
        {"id": quiz_id},
        {"$set": updated_data}
    )

    updated_quiz = await quizzes_collection.find_one(
        {"id": quiz_id},
        {"_id": 0}
    )

    return {
        "message": "Quiz updated successfully",
        "quiz": updated_quiz
    }


@router.delete("/{quiz_id}")
async def delete_quiz(
    quiz_id: str,
    current_user: dict = Depends(require_teacher)
):
    quizzes_collection = get_quizzes_collection()
    attempts_collection = get_quiz_attempts_collection()

    quiz = await quizzes_collection.find_one(
        {"id": quiz_id},
        {"_id": 0}
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found"
        )

    attempts_preserved = await attempts_collection.count_documents({
        "quiz_id": quiz_id
    })

    delete_result = await quizzes_collection.delete_one({
        "id": quiz_id
    })

    if delete_result.deleted_count == 0:
        raise HTTPException(
            status_code=500,
            detail="Quiz deletion failed"
        )

    return {
        "message": "Quiz deleted successfully",
        "quiz_id": quiz_id,
        "deleted_quiz_title": quiz.get("title"),
        "attempts_preserved": attempts_preserved
    }


@router.post("/submit")
async def submit_quiz(
    request: QuizSubmitRequest,
    current_user: dict = Depends(require_student)
):
    quizzes_collection = get_quizzes_collection()
    attempts_collection = get_quiz_attempts_collection()

    quiz = await quizzes_collection.find_one(
        {"id": request.quiz_id},
        {"_id": 0}
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found"
        )

    total_questions = len(quiz["questions"])

    if total_questions == 0:
        raise HTTPException(
            status_code=400,
            detail="This quiz has no questions"
        )

    correct_count = 0
    review = []

    for question in quiz["questions"]:
        question_id = question["id"]
        correct_answer = question["correct_option_index"]
        student_answer = request.answers.get(question_id)

        is_correct = student_answer == correct_answer

        if is_correct:
            correct_count += 1

        review.append({
            "question_id": question_id,
            "question": question["question"],
            "options": question["options"],
            "student_answer": student_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "explanation": question.get("explanation", "")
        })

    percentage = round((correct_count / total_questions) * 100, 2)

    attempt = {
        "student_email": current_user["email"],
        "student_name": current_user["name"],
        "quiz_id": quiz["id"],
        "quiz_title": quiz["title"],
        "score": correct_count,
        "total": total_questions,
        "percentage": percentage,
        "review": review,
        "created_at": datetime.utcnow().isoformat()
    }

    await attempts_collection.insert_one(attempt.copy())

    return {
        "message": "Quiz submitted successfully",
        "score": correct_count,
        "total": total_questions,
        "percentage": percentage,
        "review": review
    }