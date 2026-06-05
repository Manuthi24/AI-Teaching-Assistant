import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is missing in backend/.env")

client = Groq(api_key=GROQ_API_KEY)


def generate_rag_answer(question: str, context_chunks: list):
    context_text = ""

    for index, chunk in enumerate(context_chunks, start=1):
        context_text += f"""
Source {index}
Document: {chunk.get("title")}
Chunk: {chunk.get("chunk_index")}
Content:
{chunk.get("text")}
"""

    system_prompt = """
You are an AI Teaching Assistant.

Answer the student's question using only the provided study material context.
If the answer is not available in the context, say:
"I could not find this answer in the uploaded study materials."

Keep the answer clear, simple, and useful for students.
Do not make up information outside the provided context.
"""

    user_prompt = f"""
Student Question:
{question}

Relevant Study Material Context:
{context_text}

Now answer the student's question.
"""

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2,
        max_completion_tokens=700
    )

    return response.choices[0].message.content