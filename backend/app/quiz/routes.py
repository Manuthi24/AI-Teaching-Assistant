from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from uuid import uuid4

from app.auth.dependencies import require_teacher, require_student, get_current_user
from app.quiz.schemas import QuizGenerateRequest, QuizSubmitRequest
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
        "created_by": quiz["created_by"],
        "created_at": quiz["created_at"]
    }


@router.post("/generate")
async def generate_quiz(
    request: QuizGenerateRequest,
    current_user: dict = Depends(require_teacher)
):
    relevant_chunks = search_similar_chunks(request.topic, top_k=6)

    if not relevant_chunks:
        raise HTTPException(
            status_code=404,
            detail="No relevant study material found for this topic"
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
            "created_by_name": quiz["created_by_name"],
            "created_at": quiz["created_at"]
        })

    return {
        "quizzes": quiz_list
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