from pydantic import BaseModel, Field
from typing import Optional


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    document_id: Optional[str] = None