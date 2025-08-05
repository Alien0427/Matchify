# Resume2Job Backend

## Setup

1. Place your Firebase service account as `firebase_service_account.json` in this directory.
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the server:
   ```
   uvicorn app:app --reload
   ```

## API

- **POST /match-resume**
  - Form-data: `file` (resume PDF/DOCX/TXT/IMG)
  - Returns: Top job matches (LLM or TF-IDF fallback)

## Pipeline

- Resume parsed via IBM Docling
- Resume data cleaned using LLM (LangChain)
- Job listings pulled from Firebase
- LLM compares and returns top job matches based on compatibility
- Fallback to TF-IDF + cosine similarity if LLM fails 