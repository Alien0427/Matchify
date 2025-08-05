from docling.document_converter import DocumentConverter
import fitz  # PyMuPDF

def parse_resume(file_path):
    # Docling extraction
    converter = DocumentConverter()
    docling_result = converter.convert(file_path)
    doc_markdown = docling_result.document.export_to_markdown()

    # PyMuPDF extraction for links and plain text
    links = []
    plain_text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            plain_text += page.get_text()
            for link in page.get_links():
                if link.get("uri"):
                    links.append(link["uri"])
    except Exception as e:
        print(f"[PyMuPDF] Error extracting links/text: {e}")

    return doc_markdown, links, plain_text 