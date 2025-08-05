import requests

GEMINI_API_KEY = "AIzaSyBUsIp1TAu3oSkrRsPq5lD_8dafeUKjYrs"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY

def extract_structured_resume(doc_text, links=None):
    links = links or []
    links_str = "\n".join(links)
    prompt = f"""
You are a resume parser. Extract the following fields:
- Name
- Email
- Skills
- Work Experience
- Education
- Expected Salary (if any mentioned)
- Important URLs (LinkedIn, GitHub, certificates, portfolios, etc.)

Resume (markdown):
{doc_text}

Extracted URLs:
{links_str}

If any URLs are missing from the markdown, use the provided links list. Return all fields in JSON format, and include all URLs you find.
Respond with only valid JSON, no markdown or code block formatting.
"""
    print("[Gemini RESUME Extraction] Prompt:\n", prompt)
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    response = requests.post(GEMINI_URL, json=data)
    print("[Gemini RESUME Extraction] Raw Response:\n", response.text)
    if response.status_code == 200:
        import re, json
        try:
            text_field = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            match = re.search(r'{[\s\S]*}', text_field)
            if match:
                gemini_content = json.loads(match.group(0))
                return gemini_content
            else:
                return f"Gemini response did not contain valid JSON. Raw: {text_field}"
        except Exception as e:
            return f"Error parsing Gemini response: {e}\nRaw: {response.text}"
    else:
        return f"Gemini API error: {response.status_code} {response.text}"

def match_jobs_llm(structured_resume, job_listings):
    prompt = f"""
Candidate Profile:
{structured_resume}

Job Listings:
{job_listings}

Match the candidate to the most relevant jobs. Return top 3 matches with compatibility score and reason.
"""
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    response = requests.post(GEMINI_URL, json=data)
    if response.status_code == 200:
        try:
            gemini_content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            return gemini_content
        except Exception as e:
            return f"Error parsing Gemini response: {e}\nRaw: {response.text}"
    else:
        return f"Gemini API error: {response.status_code} {response.text}" 