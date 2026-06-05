import os
from dotenv import load_dotenv
from pinecone import Pinecone

from app.embeddings.gemini_service import generate_embedding, prepare_document_text

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "ai-teaching-assistant")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "study-materials")

if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY is missing in backend/.env")

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)


def upsert_document_chunks(
    document_id: str,
    title: str,
    chunks: list,
    uploaded_by: str,
    uploaded_by_name: str
):
    vectors = []

    for chunk_index, chunk in enumerate(chunks):
        prepared_text = prepare_document_text(chunk, title)
        embedding = generate_embedding(prepared_text)

        vector_id = f"{document_id}_chunk_{chunk_index}"

        vectors.append({
            "id": vector_id,
            "values": embedding,
            "metadata": {
                "document_id": document_id,
                "title": title,
                "chunk_index": chunk_index,
                "text": chunk,
                "uploaded_by": uploaded_by,
                "uploaded_by_name": uploaded_by_name
            }
        })

    batch_size = 50

    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]

        index.upsert(
            vectors=batch,
            namespace=PINECONE_NAMESPACE
        )

    return len(vectors)


def search_similar_chunks(question: str, top_k: int = 3, document_id: str = None):
    query_embedding = generate_embedding(question)

    query_filter = None

    if document_id:
        query_filter = {
            "document_id": {"$eq": document_id}
        }

    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        namespace=PINECONE_NAMESPACE,
        include_metadata=True,
        filter=query_filter
    )

    matches = results.matches if hasattr(results, "matches") else results.get("matches", [])

    relevant_chunks = []

    for match in matches:
        metadata = match.metadata if hasattr(match, "metadata") else match.get("metadata", {})
        score = match.score if hasattr(match, "score") else match.get("score", 0)

        relevant_chunks.append({
            "score": score,
            "document_id": metadata.get("document_id"),
            "title": metadata.get("title"),
            "chunk_index": metadata.get("chunk_index"),
            "text": metadata.get("text")
        })

    return relevant_chunks


def delete_document_vectors(document_id: str, total_chunks: int):
    if total_chunks <= 0:
        return 0

    vector_ids = [
        f"{document_id}_chunk_{chunk_index}"
        for chunk_index in range(total_chunks)
    ]

    batch_size = 100

    for i in range(0, len(vector_ids), batch_size):
        batch = vector_ids[i:i + batch_size]

        index.delete(
            ids=batch,
            namespace=PINECONE_NAMESPACE
        )

    return len(vector_ids)