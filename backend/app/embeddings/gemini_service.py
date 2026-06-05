import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "gemini-embedding-2")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "768"))

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing in backend/.env")

client = genai.Client(api_key=GEMINI_API_KEY)


def prepare_document_text(content: str, title: str = "none"):
    """
    Gemini Embedding 2 recommends adding document structure for retrieval.
    """
    if not title:
        title = "none"

    return f"title: {title} | text: {content}"


def generate_embedding(text: str):
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            output_dimensionality=EMBEDDING_DIMENSION
        )
    )

    return result.embeddings[0].values