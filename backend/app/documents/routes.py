from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pathlib import Path
from uuid import uuid4
from datetime import datetime

from app.auth.dependencies import get_current_user, require_teacher
from app.documents.pdf_utils import extract_text_from_pdf, chunk_text
from app.embeddings.pinecone_service import (
    upsert_document_chunks,
    delete_document_vectors
)
from app.database import get_database

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def get_documents_collection():
    db = get_database()
    return db["documents"]


def get_document_chunks_collection():
    db = get_database()
    return db["document_chunks"]


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_teacher)
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    document_id = str(uuid4())
    safe_filename = file.filename.replace(" ", "_")
    saved_filename = f"{document_id}_{safe_filename}"
    file_path = UPLOAD_DIR / saved_filename

    file_content = await file.read()

    with open(file_path, "wb") as f:
        f.write(file_content)

    extracted_text = extract_text_from_pdf(str(file_path))

    if not extracted_text:
        raise HTTPException(
            status_code=400,
            detail="No text found in this PDF"
        )

    chunks = chunk_text(extracted_text)

    try:
        vectors_stored = upsert_document_chunks(
            document_id=document_id,
            title=file.filename,
            chunks=chunks,
            uploaded_by=current_user["email"],
            uploaded_by_name=current_user["name"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Embedding/Pinecone storage failed: {str(e)}"
        )

    created_at = datetime.utcnow().isoformat()

    document = {
        "id": document_id,
        "title": file.filename,
        "filename": saved_filename,
        "original_filename": file.filename,
        "file_path": str(file_path),
        "uploaded_by": current_user["email"],
        "uploaded_by_name": current_user["name"],
        "total_characters": len(extracted_text),
        "total_chunks": len(chunks),
        "vectors_stored": vectors_stored,
        "created_at": created_at
    }

    document_chunks = []

    for index, chunk in enumerate(chunks):
        document_chunks.append({
            "document_id": document_id,
            "title": file.filename,
            "chunk_index": index,
            "text": chunk,
            "uploaded_by": current_user["email"],
            "created_at": created_at
        })

    documents_collection = get_documents_collection()
    chunks_collection = get_document_chunks_collection()

    await documents_collection.insert_one(document)

    if document_chunks:
        await chunks_collection.insert_many(document_chunks)

    return {
        "message": "PDF uploaded, embedded, and saved successfully",
        "document": {
            "id": document["id"],
            "title": document["title"],
            "uploaded_by": document["uploaded_by"],
            "total_characters": document["total_characters"],
            "total_chunks": document["total_chunks"],
            "vectors_stored": document["vectors_stored"],
            "created_at": document["created_at"]
        }
    }


@router.get("/")
async def get_documents(current_user: dict = Depends(get_current_user)):
    documents_collection = get_documents_collection()

    documents = []

    cursor = documents_collection.find({}, {"_id": 0}).sort("created_at", -1)

    async for document in cursor:
        documents.append(document)

    return {
        "documents": documents
    }


@router.get("/{document_id}/preview")
async def preview_document_chunks(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    documents_collection = get_documents_collection()
    chunks_collection = get_document_chunks_collection()

    document = await documents_collection.find_one(
        {"id": document_id},
        {"_id": 0}
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    preview_chunks = []

    cursor = (
        chunks_collection
        .find({"document_id": document_id}, {"_id": 0})
        .sort("chunk_index", 1)
        .limit(3)
    )

    async for chunk in cursor:
        preview_chunks.append(chunk["text"])

    return {
        "document_id": document["id"],
        "title": document["title"],
        "total_chunks": document["total_chunks"],
        "vectors_stored": document.get("vectors_stored", 0),
        "preview_chunks": preview_chunks
    }


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(require_teacher)
):
    documents_collection = get_documents_collection()
    chunks_collection = get_document_chunks_collection()

    document = await documents_collection.find_one(
        {"id": document_id},
        {"_id": 0}
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    try:
        deleted_vectors = delete_document_vectors(
            document_id=document_id,
            total_chunks=document.get("total_chunks", 0)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Pinecone vector deletion failed: {str(e)}"
        )

    file_path = Path(document.get("file_path", ""))

    if file_path.exists():
        file_path.unlink()

    await documents_collection.delete_one({"id": document_id})
    await chunks_collection.delete_many({"document_id": document_id})

    return {
        "message": "Document, chunks, file, and Pinecone vectors deleted successfully",
        "document_id": document_id,
        "deleted_vectors": deleted_vectors
    }