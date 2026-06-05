from pydantic import BaseModel, Field
from typing import Dict


class QuizGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3)
    num_questions: int = Field(default=5, ge=1, le=10)


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: Dict[str, int]