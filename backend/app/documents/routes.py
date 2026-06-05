from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pathlib import Path
from uuid import uuid4
from datetime import datetime

from app.auth.dependencies import get_current_user, require_teacher
from app.documents.pdf_utils import extract_text_from_pdf, chunk_text
from app.embeddings.pinecone_service import upsert_document_chunks

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

documents_db = []


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
        "chunks": chunks,
        "created_at": datetime.utcnow().isoformat()
    }

    documents_db.append(document)

    return {
        "message": "PDF uploaded, embedded, and stored in Pinecone successfully",
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
def get_documents(current_user: dict = Depends(get_current_user)):
    document_list = []

    for document in documents_db:
        document_list.append({
            "id": document["id"],
            "title": document["title"],
            "uploaded_by": document["uploaded_by"],
            "uploaded_by_name": document["uploaded_by_name"],
            "total_characters": document["total_characters"],
            "total_chunks": document["total_chunks"],
            "vectors_stored": document.get("vectors_stored", 0),
            "created_at": document["created_at"]
        })

    return {
        "documents": document_list
    }


@router.get("/{document_id}/preview")
def preview_document_chunks(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    document = None

    for item in documents_db:
        if item["id"] == document_id:
            document = item
            break

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return {
        "document_id": document["id"],
        "title": document["title"],
        "total_chunks": document["total_chunks"],
        "vectors_stored": document.get("vectors_stored", 0),
        "preview_chunks": document["chunks"][:3]
    }