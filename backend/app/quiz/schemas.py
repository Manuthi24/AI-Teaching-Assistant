from pydantic import BaseModel, Field
from typing import Dict, List, Optional


class QuizGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3)
    num_questions: int = Field(default=5, ge=1, le=10)
    document_id: Optional[str] = None


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: Dict[str, int]


class QuizQuestionUpdate(BaseModel):
    id: str
    question: str = Field(..., min_length=3)
    options: List[str] = Field(..., min_length=2)
    correct_option_index: int
    explanation: str = ""


class QuizUpdateRequest(BaseModel):
    title: str = Field(..., min_length=3)
    topic: str = Field(..., min_length=3)
    questions: List[QuizQuestionUpdate] = Field(..., min_length=1)