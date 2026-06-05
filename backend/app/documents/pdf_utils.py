import fitz


def extract_text_from_pdf(file_path: str):
    text = ""

    pdf_document = fitz.open(file_path)

    for page_number in range(len(pdf_document)):
        page = pdf_document[page_number]
        text += page.get_text()
        text += "\n"

    pdf_document.close()

    return text.strip()


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200):
    chunks = []

    if not text:
        return chunks

    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]

        if chunk.strip():
            chunks.append(chunk.strip())

        start += chunk_size - overlap

    return chunks