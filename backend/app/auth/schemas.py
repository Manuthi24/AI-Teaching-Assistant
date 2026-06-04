from pydantic import BaseModel
from typing import Literal


class GoogleLoginRequest(BaseModel):
    credential: str
    role: Literal["teacher", "student"]