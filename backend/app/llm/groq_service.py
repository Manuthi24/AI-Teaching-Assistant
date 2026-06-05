import json
import re
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

def extract_json_from_text(text: str):
    cleaned = text.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```json", "", cleaned)
        cleaned = re.sub(r"^```", "", cleaned)
        cleaned = re.sub(r"```$", "", cleaned)
        cleaned = cleaned.strip()

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)

    if not match:
        raise ValueError("No valid JSON found in LLM response")

    return json.loads(match.group())


def generate_quiz_questions(topic: str, context_chunks: list, num_questions: int = 5):
    context_text = ""

    for index, chunk in enumerate(context_chunks, start=1):
        context_text += f"""
Source {index}
Document: {chunk.get("title")}
Content:
{chunk.get("text")}
"""

    system_prompt = """
You are an AI Quiz Generator.

Create multiple-choice questions using only the provided study material context.
Do not create questions from outside knowledge.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
"""

    user_prompt = f"""
Topic:
{topic}

Number of questions:
{num_questions}

Study material context:
{context_text}

Return the quiz in this exact JSON format:

{{
  "title": "Quiz title here",
  "questions": [
    {{
      "id": "q1",
      "question": "Question text here",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_option_index": 0,
      "explanation": "Short explanation here"
    }}
  ]
}}
"""

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2,
        max_completion_tokens=1500
    )

    content = response.choices[0].message.content
    quiz_data = extract_json_from_text(content)

    return quiz_data