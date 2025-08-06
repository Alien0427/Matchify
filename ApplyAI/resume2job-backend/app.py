from fastapi import FastAPI, File, UploadFile, Form, Request, Query, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
from utils.docling_utils import parse_resume
from utils.llm_utils import extract_structured_resume, match_jobs_llm
from utils.firebase_utils import init_firebase, fetch_job_listings, ensure_collections_exist, ensure_messages_collection_exists
from utils.job_matching import tfidf_cosine_match, match_and_sort_jobs
import tempfile
import os
import json
from pydantic import BaseModel
from typing import List, Optional, Any
import re
from rapidfuzz import process as fuzz_process
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
import ast
import spacy
from fastapi.responses import JSONResponse
import firebase_admin.firestore as firestore
import firebase_admin.auth as admin_auth
from datetime import datetime
import json

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev, allow all. For prod, specify your frontend URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
db = init_firebase()
ensure_collections_exist(db)
ensure_messages_collection_exists(db)

GEMINI_API_KEY = "REPLACE WITH YOU GEMINI API KEY"
GEMINI_MODEL = "gemini-2.5-flash-lite-preview-06-17"
GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'  # For reference, not used directly by LangChain

# Load spaCy model globally
nlp = spacy.load("en_core_web_sm")

class JobMatch(BaseModel):
    job_id: Optional[str]
    title: str
    company: str
    description: Optional[str]
    skills_required: Optional[List[str]]
    location: Optional[str]
    employment_type: Optional[str]
    link: Optional[str]
    compatibility: float
    skill_score: Optional[float] = 0.0
    exp_score: Optional[float] = 0.0
    edu_score: Optional[float] = 0.0
    matched_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    llm_reason: Optional[str] = ""
    reason: Optional[str] = ""

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "abc123",
                "title": "Data Scientist",
                "company": "TechCorp",
                "description": "Full job description here...",
                "skills_required": ["Python", "Machine Learning"],
                "location": "Remote",
                "employment_type": "Full-time",
                "link": "https://jobs.techcorp.com/abc123",
                "compatibility": 92.0
            }
        }

class ExperienceEntry(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    dates: Optional[str] = None
    details: Optional[str] = None

class EducationEntry(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    dates: Optional[str] = None
    details: Optional[str] = None

class ResumeData(BaseModel):
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    skills: List[str]
    experience: Optional[List[ExperienceEntry]]
    education: Optional[List[EducationEntry]]
    salary_expectations: Optional[str]
    links: Optional[List[str]]

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "phone": "+1234567890",
                "skills": ["Python", "Machine Learning", "Data Analysis"],
                "experience": [
                    {"title": "Data Scientist", "company": "TechCorp", "dates": "2019-2023", "details": "Worked on ML models."},
                    {"title": "Analyst", "company": "DataInc", "dates": "2017-2019", "details": "Analyzed data."}
                ],
                "education": [
                    {"degree": "MSc Computer Science", "institution": "University X", "dates": "2015-2017", "details": ""},
                    {"degree": "BSc Mathematics", "institution": "University Y", "dates": "2011-2015", "details": ""}
                ],
                "salary_expectations": "120000 per year",
                "links": ["https://linkedin.com/in/janedoe"]
            }
        }

class MatchResponse(BaseModel):
    matches: List[JobMatch]
    resume_data: Optional[ResumeData] = None
    fallback: Optional[bool] = False
    error: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "matches": [JobMatch.Config.json_schema_extra["example"]],
                "resume_data": ResumeData.Config.json_schema_extra["example"],
                "fallback": False,
                "error": None
            }
        }

class JobApplication(BaseModel):
    job_id: str
    candidate_uid: str
    recruiter_id: str
    resume_url: str
    status: str = "applied"
    applied_at: str = datetime.utcnow().isoformat()
    notes: Optional[str] = None

# Predefined list of known skills (can be extended or loaded from a file)
KNOWN_SKILLS = [
    # Programming languages
    'python', 'java', 'javascript', 'js', 'typescript', 'ts', 'c++', 'cpp', 'c', 'c#', 'c sharp', 'r', 'bash',
    # Web basics and variants
    'html', 'html5', 'html 5', 'css', 'css3', 'css 3', 'scss', 'sass', 'less',
    # Frontend frameworks
    'react', 'reactjs', 'react.js', 'next.js', 'nextjs', 'vue', 'vuejs', 'vue.js', 'angular', 'angularjs', 'angular.js', 'svelte', 'sveltejs', 'svelte.js',
    'tailwind css', 'tailwindcss', 'redux', 'bootstrap', 'vite', 'material ui', 'mui', 'ant design', 'antd', 'framer motion', 'motion', 'three.js', 'threejs',
    # Backend frameworks
    'node.js', 'nodejs', 'node', 'fastapi', 'flask', 'django', 'express', 'expressjs', 'express.js', 'spring boot', 'springboot',
    # APIs
    'rest api', 'restapi', 'restful api', 'restfulapi', 'graphql', 'soap',
    # Databases
    'sql', 'nosql', 'mongodb', 'mongo db', 'mongo', 'postgresql', 'postgres', 'postgre', 'mysql', 'sqlite', 'firebase', 'redis', 'dynamodb', 'cassandra',
    # Data science & ML
    'scikit-learn', 'sklearn', 'pandas', 'numpy', 'xgboost', 'shap', 'opencv', 'nltk', 'spacy', 'matplotlib', 'seaborn', 'tensorflow', 'keras', 'pytorch', 'torch', 'ml', 'machine learning', 'deep learning', 'dl', 'nlp', 'computer vision',
    # Cloud & DevOps
    'aws', 'amazon web services', 'gcp', 'google cloud', 'azure', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'cicd', 'jenkins', 'github actions', 'gitlab ci',
    # Tools
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'figma', 'adobe xd', 'storybook', 'webpack', 'babel', 'vite', 'parcel', 'eslint', 'prettier',
    # Product/Design/Management
    'user research', 'wireframing', 'prototyping', 'design systems', 'usability testing', 'product management', 'agile', 'scrum', 'kanban',
    # Security
    'penetration testing', 'firewalls', 'siem', 'qwasp',
    # Analytics/BI
    'powerbi', 'power bi', 'restful apis',
    # Mobile
    'android sdk', 'flutter', 'dart', 'push notifications',
    # Other
    'streamlit', 'hugging face', 'langchain', 'rag', 'transformers', 'gemini pro', 'vertex ai', 'openai api',
    'ci/cd', 'material ui', 'framer motion', 'three.js', 'heroku', 'vercel', 'netlify', 'oop', 'object oriented programming', 'trello', 'notion', 'slack',
]

SECTION_HEADERS = {
    'skills': ["skills", "skill set", "technical skills", "core skills"],
    'experience': ["experience", "professional experience", "work history", "experiences"],
    'education': ["education", "educations", "education & certifications", "academic background"]
}

# Advanced regex extraction
import difflib

def find_section(lines, section_names):
    indices = []
    for idx, line in enumerate(lines):
        l = line.strip().lower()
        for name in section_names:
            if name in l:
                indices.append(idx)
    return indices

def extract_fields_from_markdown_advanced(markdown):
    skills = set()
    experience = []
    education = []
    emails = set()
    phones = set()
    name = None
    lines = markdown.splitlines()
    # Regex patterns
    email_pattern = re.compile(r'[\w\.-]+@[\w\.-]+')
    phone_pattern = re.compile(r'\+?\d[\d\s\-()]{7,}\d')
    date_pattern = re.compile(r'(\d{4})\s*[-–]\s*(\d{4}|present)', re.IGNORECASE)
    # Find all emails/phones
    for line in lines:
        for email in email_pattern.findall(line):
            emails.add(email)
        for phone in phone_pattern.findall(line):
            phones.add(phone)
    # Name: first non-header, non-email, non-phone line
    for line in lines:
        if line.strip() and not line.strip().startswith('#') and not email_pattern.search(line) and not phone_pattern.search(line):
            name = line.strip()
            break
    # Section detection
    section = None
    for idx, line in enumerate(lines):
        l = line.strip().lower()
        # Section header detection (robust)
        for sec, headers in SECTION_HEADERS.items():
            for h in headers:
                if h in l:
                    section = sec
                    break
        if l.startswith('##') or l.startswith('#'):
            section = None
        # Skills extraction (fuzzy match)
        if section == 'skills' and line.strip() and not line.strip().startswith('#'):
            # Split on more delimiters: ; , / | & -
            tokens = re.split(r'[;,/|&\-]', line)
            for token in tokens:
                token = token.strip()
                if not token:
                    continue
                # Extract base skill from phrases like 'SQL databases', 'PowerBI dashboards', etc.
                # Try to match known skills within the token
                found_skill = False
                for known_skill in KNOWN_SKILLS:
                    if known_skill in token.lower():
                        skills.add(known_skill)
                        found_skill = True
                if found_skill:
                    continue
                result = fuzz_process.extractOne(token.lower(), KNOWN_SKILLS, score_cutoff=80)
                if result:
                    match, score, _ = result
                    skills.add(match)
                else:
                    close = difflib.get_close_matches(token.lower(), KNOWN_SKILLS, n=1, cutoff=0.8)
                    if close:
                        skills.add(close[0])
                    else:
                        skills.add(token.lower())
        # Experience extraction
        elif section == 'experience' and line.strip() and not line.strip().startswith('#'):
            date_match = date_pattern.search(line)
            if date_match:
                dates = date_match.group(0)
                before = lines[idx-1].strip() if idx > 0 else ''
                after = lines[idx+1].strip() if idx+1 < len(lines) else ''
                exp_obj = {
                    "title": before if before and not before.startswith('#') else '',
                    "company": '',
                    "dates": dates,
                    "details": after if after and not after.startswith('#') else ''
                }
                experience.append(exp_obj)
            else:
                experience.append({"title": line.strip(), "company": '', "dates": '', "details": ''})
        # Education extraction
        elif section == 'education' and line.strip() and not line.strip().startswith('#'):
            date_match = date_pattern.search(line)
            if date_match:
                dates = date_match.group(0)
                before = lines[idx-1].strip() if idx > 0 else ''
                after = lines[idx+1].strip() if idx+1 < len(lines) else ''
                edu_obj = {
                    "degree": before if before and not before.startswith('#') else '',
                    "institution": '',
                    "dates": dates,
                    "details": after if after and not after.startswith('#') else ''
                }
                education.append(edu_obj)
            else:
                education.append({"degree": line.strip(), "institution": '', "dates": '', "details": ''})
    # If no skills found in section, scan entire document for known skills
    if not skills:
        doc_text = ' '.join(lines).lower()
        for known_skill in KNOWN_SKILLS:
            if known_skill in doc_text:
                skills.add(known_skill)
    # NLP-based skill extraction from the entire resume text (supplemental)
    def extract_skills_nlp(text, known_skills):
        doc = nlp(text.lower())
        found_skills = set()
        for skill in known_skills:
            skill_lower = skill.lower()
            if skill_lower in text.lower():
                found_skills.add(skill)
        return found_skills
    nlp_skills = extract_skills_nlp(' '.join(lines), KNOWN_SKILLS)
    skills.update(nlp_skills)
    return {
        'name': name,
        'emails': list(emails),
        'phones': list(phones),
        'skills': list(skills),
        'experience': experience,
        'education': education
    }

def extract_with_gemini(doc_markdown):
    prompt = ChatPromptTemplate.from_template(
        '''
        Extract the following fields from this resume:
        - Name
        - All Emails
        - All Phones
        - Skills (as a list)
        - Experience (as a list of objects: title, company, dates, details)
        - Education (as a list of objects: degree, institution, dates, details)
        Return as valid JSON.
        Resume:
        {resume}
        '''
    )
    llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL, google_api_key=GEMINI_API_KEY)
    response = llm.invoke(prompt.format(resume=doc_markdown))
    match = re.search(r'{[\s\S]*}', response.content)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            # Try to parse as Python dict (pseudo-JSON)
            try:
                return ast.literal_eval(match.group(0))
            except Exception:
                return None
    else:
        return None

def merge_extraction(regex_fields, llm_fields):
    # Prefer LLM extraction when available, fallback to regex
    merged = dict(regex_fields)
    
    print(f"[DEBUG] Regex fields: {regex_fields}")
    print(f"[DEBUG] LLM fields: {llm_fields}")
    
    if llm_fields:
        # Use LLM fields when available, they're more accurate
        for k in ['name', 'skills', 'experience', 'education', 'emails', 'phones']:
            if llm_fields.get(k):
                merged[k] = llm_fields[k]
                print(f"[DEBUG] Using LLM {k}: {llm_fields[k]}")
            elif merged.get(k):
                print(f"[DEBUG] Using regex {k}: {merged[k]}")
    
    print(f"[DEBUG] Final merged fields: {merged}")
    return merged

def llm_match_and_reason(resume_data, job):
    prompt = ChatPromptTemplate.from_template(
        """
        Candidate Resume:
        Name: {name}
        Emails: {emails}
        Phones: {phones}
        Skills: {skills}
        Experience: {experience}
        Education: {education}

        Job Listing:
        Title: {title}
        Company: {company}
        Description: {description}
        Skills Required: {skills_required}
        Location: {location}
        Employment Type: {employment_type}

        1. Give a compatibility score (0-100) for how well this candidate fits this job.
        2. Give an experience score (0-100) based on how well the candidate's work experience matches the job requirements.
        3. Give an education score (0-100) based on how well the candidate's education background matches the job requirements.
        4. In your explanation, do the following:
           - List which required skills are present in the candidate's profile, and which are missing.
           - Mention any relevant experience or education that makes the candidate a good fit.    
           - If there are any gaps (missing skills, experience, or education), mention them.      
           - Summarize in a friendly, encouraging tone why this candidate should (or should not) apply.

        Respond in JSON:
        {{
            "compatibility": <score>,
            "exp_score": <experience_score>,
            "edu_score": <education_score>,
            "reason": "<detailed explanation>"
        }}
        """
    )
    llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL, google_api_key=GEMINI_API_KEY)
    formatted_prompt = prompt.format(
        name=resume_data.get('name', ''),
        emails=", ".join(resume_data.get('emails', [])),
        phones=", ".join(resume_data.get('phones', [])),
        skills=", ".join(resume_data.get('skills', [])),
        experience=resume_data.get('experience', ''),
        education=resume_data.get('education', ''),
        title=job.get("title", ""),
        company=job.get("company", ""),
        description=job.get("description", ""),
        skills_required=", ".join(job.get("skills_required") or job.get("skills") or []),
        location=job.get("location", ""),
        employment_type=job.get("employment_type", "")
    )
    print("[Gemini JOB Reasoning] Prompt:\n", formatted_prompt)
    response = llm.invoke(formatted_prompt)
    print("[Gemini JOB Reasoning] Raw Response:\n", response.content)
    import json, re
    match = re.search(r'{[\s\S]*}', response.content)
    if match:
        result = json.loads(match.group(0))
        # Fallback: if reason is empty or missing, generate a generic explanation
        if not result.get('reason'):
            result['reason'] = (
                f"Based on your resume and the job description for {job.get('title', '')} at {job.get('company', '')}, "
                "we couldn't extract detailed skills or experience matches, but you may still be a good fit! "
                "We encourage you to review the job requirements and consider applying if you feel qualified. "
                "If you want a more tailored match, try updating your resume with more details."
            )
        return result
    else:
        # Fallback: always return a generic explanation
        return {
            "compatibility": 0,
            "exp_score": 0,
            "edu_score": 0,
            "reason": (
                f"Based on your resume and the job description for {job.get('title', '')} at {job.get('company', '')}, "
                "we couldn't extract detailed skills or experience matches, but you may still be a good fit! "
                "We encourage you to review the job requirements and consider applying if you feel qualified. "
                "If you want a more tailored match, try updating your resume with more details."
            )
        }

def normalize_job(job, idx=0):
    # Canonicalize employment type
    raw_employment = job.get("employment_type") or job.get("employment") or ""
    employment_type = ""
    if isinstance(raw_employment, str):
        emp = raw_employment.strip().lower().replace('-', ' ').replace('_', ' ')
        if 'full' in emp:
            employment_type = 'Full Time'
        elif 'part' in emp:
            employment_type = 'Part Time'
        elif 'intern' in emp:
            employment_type = 'Internship'
        else:
            employment_type = raw_employment.strip()
    return {
        "job_id": job.get("job_id") or job.get("id") or str(idx),
        "title": job.get("title", ""),
        "company": job.get("company", ""),
        "description": job.get("description", ""),
        "skills_required": job.get("skills_required") or job.get("skills") or [],
        "location": job.get("location", ""),
        "employment_type": employment_type,
        "link": job.get("link", ""),
        "compatibility": job.get("compatibility", 0.0),
        "skill_score": job.get("skill_score", 0.0),
        "exp_score": job.get("exp_score", 0.0),
        "edu_score": job.get("edu_score", 0.0),
        "matched_skills": job.get("matched_skills", []),
        "missing_skills": job.get("missing_skills", []),
        "llm_reason": job.get("llm_reason", ""),
        "reason": job.get("reason", ""),
        "recruiterId": job.get("recruiterId") or job.get("recruiterID") or "",
    }

@app.post("/match-resume", response_model=MatchResponse, responses={
    200: {
        "description": "Top job matches with compatibility %",
        "content": {
            "application/json": {
                "example": MatchResponse.Config.json_schema_extra["example"]
            }
        }
    }
})
async def match_resume(
    resume: UploadFile = File(None),
    jobs: str = Form(None),
    use_llm: bool = Form(False),
    manual_skills: str = Form(None),
    manual_experience: str = Form(None)
):
    print('Received /match-resume request')
    
    # If manual fields are provided, use them directly
    if manual_skills or manual_experience:
        print('Manual skills/experience provided, using for matching.')
        skills = [s.strip() for s in (manual_skills or '').split(',') if s.strip()]
        experience = []
        if manual_experience:
            # Try to parse as JSON first, fall back to plain text
            try:
                exp_data = json.loads(manual_experience)
                if isinstance(exp_data, list):
                    experience = exp_data
                else:
                    experience = [{"title": exp_data.get("title", ""), 
                                "company": exp_data.get("company", ""),
                                "dates": exp_data.get("dates", ""),
                                "details": exp_data.get("details", "")}]
            except (json.JSONDecodeError, TypeError):
                experience = [{"title": manual_experience, "company": "", "dates": "", "details": ""}]
        
        # Get job listings
        try:
            job_listings = json.loads(jobs) if jobs else fetch_job_listings(db)
            print(f'Found {len(job_listings)} jobs')
            
            # Match jobs with the provided skills and experience
            sorted_jobs = match_and_sort_jobs(skills, job_listings, experience, [])
            normalized_matches = [normalize_job(job, idx) for idx, job in enumerate(sorted_jobs)]
            
            # Prepare resume data
            resume_data = ResumeData(
                name=None,
                email=None,
                phone=None,
                skills=skills,
                experience=experience,
                education=[],
                salary_expectations=None,
                links=[]
            )
            
            print('Returning MatchResponse with', len(normalized_matches), 'matches (manual input)')
            return MatchResponse(
                matches=normalized_matches, 
                resume_data=resume_data, 
                fallback=True, 
                error=None
            )
            
        except Exception as e:
            import traceback
            print('Error processing manual input:')
            print(traceback.format_exc())
            return MatchResponse(
                matches=[], 
                resume_data=None, 
                fallback=True, 
                error=f"Error processing manual input: {str(e)}"
            )
    
    # Process uploaded resume
    if not resume:
        return MatchResponse(
            matches=[],
            resume_data=None,
            fallback=True,
            error="No resume file or manual data provided"
        )
    
    # Save uploaded file to temp
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume.filename)[-1]) as tmp:
        tmp.write(await resume.read())
        tmp_path = tmp.name
    
    try:
        print('Parsing resume...')
        try:
            docling_result = parse_resume(tmp_path)
        except Exception as e:
            print(f"Docling parse failed: {e}")
            docling_result = None
            
        if not docling_result or any(x is None for x in docling_result):
            print('Docling failed or returned None, falling back to plain text and Gemini LLM extraction...')
            # Try to extract plain text for LLM
            import fitz
            plain_text = ''
            links = []
            try:
                doc = fitz.open(tmp_path)
                for page in doc:
                    plain_text += page.get_text()
                    for link in page.get_links():
                        if link.get("uri"):
                            links.append(link["uri"])
            except Exception as e:
                print(f"[PyMuPDF fallback] Error extracting links/text: {e}")
                return MatchResponse(
                    matches=[],
                    resume_data=None,
                    fallback=True,
                    error="Failed to extract text from the resume. Please try again or enter your information manually."
                )
            doc_markdown = plain_text or ''
        else:
            doc_markdown, links, plain_text = docling_result
            
        print('Extracting fields with regex...')
        regex_fields = extract_fields_from_markdown_advanced(doc_markdown)
        
        # If we still don't have enough information, prompt for manual input
        if not (regex_fields.get('skills') or regex_fields.get('experience') or regex_fields.get('education')):
            return MatchResponse(
                matches=[],
                resume_data=None,
                fallback=True,
                error="We could not extract enough information from your resume. Please enter your skills and work experience manually."
            )
            
        llm_fields = None
        if use_llm or not regex_fields.get('skills'):
            print('Extracting fields with Gemini LLM...')
            try:
                llm_json = extract_structured_resume(doc_markdown, links)
                llm_fields = json.loads(llm_json) if isinstance(llm_json, str) else llm_json
                
                # Map LLM fields to expected format
                if llm_fields:
                    mapped_llm_fields = {}
                    field_mapping = {
                        'Name': 'name',
                        'name': 'name',
                        'Email': 'email',
                        'email': 'email',
                        'Emails': 'emails',
                        'emails': 'emails',
                        'Phone': 'phone',
                        'phone': 'phone',
                        'Phones': 'phones',
                        'phones': 'phones',
                        'Skills': 'skills',
                        'skills': 'skills',
                        'Work Experience': 'experience',
                        'Experience': 'experience',
                        'experience': 'experience',
                        'Education': 'education',
                        'education': 'education',
                        'Important URLs': 'links',
                        'links': 'links'
                    }
                    
                    for gemini_key, expected_key in field_mapping.items():
                        if gemini_key in llm_fields and llm_fields[gemini_key]:
                            mapped_llm_fields[expected_key] = llm_fields[gemini_key]
                    
                    llm_fields = mapped_llm_fields
            except Exception as e:
                print(f"Error parsing Gemini LLM JSON: {e}")
                llm_fields = None
        
        # Merge extraction results
        merged_fields = merge_extraction(regex_fields, llm_fields)
        
        # Ensure we have required fields
        resume_skills = merged_fields.get('skills', [])
        resume_experience = merged_fields.get('experience', [])
        resume_education = merged_fields.get('education', [])
        
        # Final validation
        if not (resume_skills or resume_experience or resume_education):
            return MatchResponse(
                matches=[],
                resume_data=None,
                fallback=True,
                error="We could not extract enough information from your resume. Please enter your skills and work experience manually."
            )
        
        # Get job listings
        job_listings = json.loads(jobs) if jobs else fetch_job_listings(db)
        print(f'Found {len(job_listings)} jobs')
        
        # Match jobs
        sorted_jobs = match_and_sort_jobs(resume_skills, job_listings, resume_experience, resume_education)
        normalized_matches = [normalize_job(job, idx) for idx, job in enumerate(sorted_jobs)]
        
        # If using LLM, enhance with reasoning
        if use_llm and normalized_matches:
            print('Running LLM-powered matching and reasoning...')
            for job in normalized_matches:
                llm_result = llm_match_and_reason(merged_fields, job)
                job['compatibility'] = llm_result.get('compatibility', job['compatibility'])
                job['reason'] = llm_result.get('reason', '')
                job['llm_reason'] = llm_result.get('reason', '') or 'No explanation available from the AI.'
        
        # Ensure all jobs have required fields
        for job in normalized_matches:
            if 'llm_reason' not in job:
                job['llm_reason'] = job.get('reason', '') or 'No explanation available from the AI.'
        
        # Prepare response
        resume_data = ResumeData(
            name=merged_fields.get('name'),
            email=merged_fields.get('emails', [None])[0] if merged_fields.get('emails') else None,
            phone=merged_fields.get('phones', [None])[0] if merged_fields.get('phones') else None,
            skills=resume_skills,
            experience=resume_experience,
            education=resume_education,
            salary_expectations=None,
            links=links
        )
        
        print(f'Returning MatchResponse with {len(normalized_matches)} matches')
        return MatchResponse(
            matches=normalized_matches, 
            resume_data=resume_data, 
            fallback=not use_llm, 
            error=None
        )
        
    except Exception as e:
        import traceback
        print('Exception in /match-resume:')
        print(traceback.format_exc())
        return MatchResponse(
            matches=[], 
            resume_data=None, 
            fallback=True, 
            error=f"Error processing resume: {str(e)}"
        )
    finally:
        # Clean up temp file
        try:
            os.remove(tmp_path)
            print(f'Removed temp file: {tmp_path}')
        except Exception as e:
            print(f'Error removing temp file: {e}')

@app.post("/test-docling")
async def test_docling(resume: UploadFile = File(...)):
    import traceback
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume.filename)[-1]) as tmp:
            tmp.write(await resume.read())
            tmp_path = tmp.name
        print(f"[Docling Test] Saved file to {tmp_path}")
        doc_markdown, links, plain_text = parse_resume(tmp_path)
        print(f"[Docling Test] Markdown preview:\n{doc_markdown[:500]}")
        response = {
            "success": True,
            "markdown": doc_markdown,
            "links": links,
            "plain_text": plain_text[:1000]  # preview only first 1000 chars
        }
        return response
    except Exception as e:
        print(f"[Docling Test] Error: {e}\n{traceback.format_exc()}")
        return {"success": False, "error": str(e)}
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass 

@app.post("/register")
async def register(request: Request):
    data = await request.json()
    print("DEBUG: Received registration data:", data)
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "candidate")
    fullName = data.get("fullName")
    companyName = data.get("companyName")
    qualifications = data.get("qualifications")
    companyEmail = data.get("companyEmail")
    phone = data.get("phone")
    uid = data.get("uid")
    # List of public email domains to block for recruiters
    public_email_domains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com', 'gmx.com', 'pm.me', 'msn.com', 'live.com', 'comcast.net', 'me.com', 'rediffmail.com', 'rocketmail.com', 'ymail.com', 'inbox.com', 'fastmail.com', 'hushmail.com', 'tutanota.com', 'mail.ru', 'qq.com', 'naver.com', '163.com', '126.com', 'sina.com', 'yeah.net', 'googlemail.com'
    ]
    def is_public_email(email):
        domain = email.split('@')[1].lower() if email and '@' in email else ''
        return domain in public_email_domains
    try:
        if role == "recruiter":
            if not uid:
                print("DEBUG: Missing UID for recruiter registration")
                return JSONResponse({"success": False, "error": "Missing Firebase UID for recruiter."})
            # Only block public email domains for companyEmail, not main email
            if is_public_email(companyEmail):
                return JSONResponse({"success": False, "error": "Recruiters must use a company email address (public email domains are not allowed)."})
            # BYPASS: For local testing, skip Firebase Auth checks and set both to True
            email_verified = True
            phone_verified = True
        else:
            email_verified = False
            phone_verified = False
        # For local testing: always allow registration, even if email exists
        user_ref = db.collection('users').document(uid if uid else None)
        user_doc = {"uid": uid if uid else user_ref.id, "email": email, "role": role}
        print("DEBUG: Writing user_doc to Firestore:", user_doc)
        user_ref.set(user_doc)  # Overwrites if exists
        recruiterId = None
        if role == "recruiter":
            recruiter_ref = db.collection('recruiters').document()
            recruiterId = recruiter_ref.id
            recruiter_doc = {
                "userId": uid,
                "fullName": fullName,
                "companyName": companyName,
                "qualifications": qualifications,
                "companyEmail": companyEmail,
                "phone": phone,
                "emailVerified": email_verified,
                "phoneVerified": phone_verified,
                "isPro": False,
                "verificationStatus": "verified"
            }
            print("DEBUG: Writing recruiter_doc to Firestore:", recruiter_doc)
            recruiter_ref.set(recruiter_doc)
            user_ref.set({"role": "recruiter", "recruiterId": recruiterId}, merge=True)
            # If not both verified, return a message
            if not (email_verified and phone_verified):
                return JSONResponse({"success": False, "error": "Recruiter must verify both email and phone number before approval.", "verificationStatus": "pending"})
        print("DEBUG: Registration complete for UID:", uid, "RecruiterId:", recruiterId)
        return JSONResponse({"success": True, "uid": uid if uid else user_ref.id, "recruiterId": recruiterId})
    except Exception as e:
        print("DEBUG: Exception in /register:", e)
        # For local testing: ignore duplicate email errors and always return success
        if "already exists" in str(e) or "email-already-in-use" in str(e):
            return JSONResponse({"success": True, "uid": uid if uid else None, "recruiterId": None, "warning": "Duplicate email ignored for local testing."})
        return JSONResponse({"success": False, "error": str(e)}) 

@app.get("/recruiter/profile")
async def get_recruiter_profile(recruiterId: str = Query(...)):
    try:
        doc = db.collection('recruiters').document(recruiterId).get()
        if not doc.exists:
            return JSONResponse({"success": False, "error": "Recruiter not found"})
        return JSONResponse({"success": True, "profile": doc.to_dict()})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)})

@app.put("/recruiter/profile")
async def update_recruiter_profile(recruiterId: str = Query(...), request: Request = None):
    try:
        data = await request.json()
        db.collection('recruiters').document(recruiterId).update(data)
        return JSONResponse({"success": True})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)})

@app.post("/recruiter/jobs")
async def create_job(request: Request):
    data = await request.json()
    recruiterId = data.get("recruiterId")
    job_ref = db.collection('jobs').document()
    job_doc = {
        "job_id": job_ref.id,  # Use job_id for consistency
        "recruiterId": recruiterId,  # Always use recruiterId
        "company": data.get("company"),
        "title": data.get("title"),
        "skills": data.get("skills"),
        "skills_required": data.get("skills_required"),  # In case frontend sends this
        "description": data.get("description"),
        "employment": data.get("employment"),
        "employment_type": data.get("employment_type"),  # In case frontend sends this
        "location": data.get("location"),
        "link": data.get("link", ""),
    }
    job_ref.set(job_doc)
    return {"success": True, "job": job_doc}

@app.get("/recruiter/jobs")
async def get_jobs(recruiterId: str):
    try:
        # Get jobs where recruiterId matches
        jobs_ref = db.collection('jobs').where('recruiterId', '==', recruiterId)
        jobs = [{
            **job.to_dict(),
            'id': job.id,  # Include the document ID
            'recruiterId': job.get('recruiterId'),  # Ensure consistent field name
            'job_id': job.id  # For backward compatibility
        } for job in jobs_ref.stream()]
        
        return {"success": True, "jobs": jobs}
    except Exception as e:
        print(f"Error fetching jobs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch jobs: {str(e)}"
        )

@app.get("/job/applicants")
async def list_applicants(jobId: str = Query(...)):
    try:
        applicants = db.collection('applicants').where('jobId', '==', jobId).stream()
        applicant_list = [doc.to_dict() for doc in applicants]
        return JSONResponse({"success": True, "applicants": applicant_list})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}) 

@app.post("/messages")
async def send_message(request: Request):
    data = await request.json()
    recruiterId = data.get("recruiterId")
    applicantId = data.get("applicantId")
    jobId = data.get("jobId")
    sender = data.get("sender")  # 'recruiter' or 'applicant'
    content = data.get("content")
    try:
        # Check recruiter isPro
        recruiter_doc = db.collection('recruiters').document(recruiterId).get()
        if not recruiter_doc.exists or not recruiter_doc.to_dict().get('isPro'):
            return JSONResponse({"success": False, "error": "Messaging is only available for Pro recruiters."})
        # Store message
        msg_ref = db.collection('messages').document()
        msg_doc = {
            "id": msg_ref.id,
            "jobId": jobId,
            "recruiterId": recruiterId,
            "applicantId": applicantId,
            "sender": sender,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        msg_ref.set(msg_doc)
        return JSONResponse({"success": True, "messageId": msg_ref.id})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)})

@app.get("/messages")
async def get_messages(jobId: str = Query(...), recruiterId: str = Query(...), applicantId: str = Query(...)):
    try:
        msgs = db.collection('messages') \
            .where('jobId', '==', jobId) \
            .where('recruiterId', '==', recruiterId) \
            .where('applicantId', '==', applicantId) \
            .order_by('timestamp') \
            .stream()
        msg_list = [doc.to_dict() for doc in msgs]
        return JSONResponse({"success": True, "messages": msg_list})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}) 

@app.post("/messages/bulk")
async def send_bulk_messages(request: Request):
    data = await request.json()
    recruiterId = data.get("recruiterId")
    jobId = data.get("jobId")
    applicantIds = data.get("applicantIds", [])
    template = data.get("template")
    try:
        # Check recruiter isPro
        recruiter_doc = db.collection('recruiters').document(recruiterId).get()
        if not recruiter_doc.exists or not recruiter_doc.to_dict().get('isPro'):
            return JSONResponse({"success": False, "error": "Bulk messaging is only available for Pro recruiters."})
        sent = []
        for applicantId in applicantIds:
            msg_ref = db.collection('messages').document()
            msg_doc = {
                "id": msg_ref.id,
                "jobId": jobId,
                "recruiterId": recruiterId,
                "applicantId": applicantId,
                "sender": "recruiter",
                "content": template,
                "timestamp": datetime.utcnow().isoformat()
            }
            msg_ref.set(msg_doc)
            sent.append(msg_ref.id)
        return JSONResponse({"success": True, "sent": sent})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)})

@app.put("/applicant/status")
async def update_applicant_status(request: Request):
    data = await request.json()
    applicantId = data.get("applicantId")
    status = data.get("status")
    try:
        applicant_ref = db.collection('applicants').document(applicantId)
        if not applicant_ref.get().exists:
            return JSONResponse({"success": False, "error": "Applicant not found"})
        applicant_ref.update({"status": status})
        return JSONResponse({"success": True})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}) 

@app.post("/job/apply")
async def apply_to_job(
    resume: UploadFile = File(...),
    jobId: str = Form(...),
    candidateUid: str = Form(...),
    recruiterId: str = Form(...)
):
    try:
        # Validate file type
        if not resume.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed"
            )

        # Generate a unique filename
        file_ext = os.path.splitext(resume.filename)[1]
        filename = f"resumes/{candidateUid}_{jobId}_{int(datetime.utcnow().timestamp())}{file_ext}"
        
        # In a production environment, you would upload this to a storage service like Firebase Storage
        # For now, we'll just save it locally
        os.makedirs("uploads/resumes", exist_ok=True)
        file_path = os.path.join("uploads", filename)
        
        with open(file_path, "wb") as buffer:
            content = await resume.read()
            buffer.write(content)
        
        # Store application in Firestore
        db = firestore.client()
        app_id = str(uuid.uuid4())
        
        application_data = {
            "id": app_id,
            "job_id": jobId,
            "candidate_uid": candidateUid,
            "recruiter_id": recruiterId,
            "resume_url": f"/uploads/{filename}",  # Update this with actual storage URL in production
            "status": "applied",
            "applied_at": datetime.utcnow().isoformat(),
            "notes": ""
        }
        
        # Add to applications collection
        db.collection("applications").document(app_id).set(application_data)
        
        # Also add reference to the job's applicants
        job_ref = db.collection("jobs").document(jobId)
        job_ref.update({
            "applicants": firestore.ArrayUnion([candidateUid])
        })
        
        # Add reference to user's applications
        user_ref = db.collection("users").document(candidateUid)
        user_ref.update({
            "applications": firestore.ArrayUnion([{
                "job_id": jobId,
                "status": "applied",
                "applied_at": datetime.utcnow().isoformat()
            }])
        })
        
        return {"success": True, "message": "Application submitted successfully"}
        
    except Exception as e:
        print(f"Error in apply_to_job: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process application: {str(e)}"
        )

@app.get("/job/applicants/{job_id}")
async def get_job_applicants(job_id: str, recruiter_id: str = Query(...)):
    try:
        db = firestore.client()
        
        # First verify the recruiter owns this job
        job_doc = db.collection("jobs").document(job_id).get()
        if not job_doc.exists or job_doc.to_dict().get("recruiter_id") != recruiter_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view these applications"
            )
        
        # Get all applications for this job
        applications = db.collection("applications").where("job_id", "==", job_id).stream()
        
        # Get user details for each applicant
        applicants = []
        for app in applications:
            app_data = app.to_dict()
            user_doc = db.collection("users").document(app_data["candidate_uid"]).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                applicants.append({
                    "application_id": app.id,
                    "candidate_uid": app_data["candidate_uid"],
                    "name": user_data.get("displayName", ""),
                    "email": user_data.get("email", ""),
                    "resume_url": app_data.get("resume_url", ""),
                    "status": app_data.get("status", "applied"),
                    "applied_at": app_data.get("applied_at", ""),
                    "notes": app_data.get("notes", "")
                })
        
        return {"success": True, "applicants": applicants}
        
    except Exception as e:
        print(f"Error in get_job_applicants: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch applicants: {str(e)}"
        )

@app.post("/job/apply")
async def apply_to_job(request: Request):
    data = await request.json()
    jobId = data.get("jobId")
    candidateUid = data.get("candidateUid")
    recruiterId = data.get("recruiterId")
    if not jobId or not candidateUid or not recruiterId:
        return {"success": False, "error": "Missing jobId, candidateUid, or recruiterId"}
    app_ref = db.collection('applicants').document()
    app_doc = {
        "id": app_ref.id,
        "jobId": jobId,
        "candidateUid": candidateUid,
        "recruiterId": recruiterId,
        "status": "Applied"
    }
    app_ref.set(app_doc)
    return {"success": True, "application": app_doc}

@app.get("/user-info")
async def user_info(uid: str = None):
    if not uid:
        return {"success": False, "error": "Missing uid"}
    user_doc = db.collection('users').document(uid).get()
    if not user_doc.exists:
        return {"success": False, "error": "User not found"}
    user_data = user_doc.to_dict()
    role = user_data.get('role', 'candidate')
    recruiterId = user_data.get('recruiterId') if role == 'recruiter' else None
    return {"success": True, "role": role, "recruiterId": recruiterId} 

@app.post("/job/update-status")
async def update_application_status(request: Request):
    try:
        data = await request.json()
        application_id = data.get("applicationId")
        new_status = data.get("status")
        notes = data.get("notes")
        recruiter_id = data.get("recruiterId")
        
        if not application_id or not recruiter_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields"
            )
        
        db = firestore.client()
        app_ref = db.collection("applications").document(application_id)
        app_data = app_ref.get()
        
        if not app_data.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        # Verify the recruiter has access to this application
        app_dict = app_data.to_dict()
        if app_dict.get("recruiter_id") != recruiter_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this application"
            )
        
        # Prepare update data
        update_data = {
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if new_status:
            update_data["status"] = new_status
            
            # Also update the status in the user's applications array
            user_ref = db.collection("users").document(app_dict["candidate_uid"])
            user_data = user_ref.get().to_dict()
            
            if user_data and "applications" in user_data:
                updated_apps = [
                    {**app, "status": new_status} 
                    if app.get("job_id") == app_dict["job_id"] 
                    else app 
                    for app in user_data["applications"]
                ]
                user_ref.update({"applications": updated_apps})
        
        if notes is not None:
            update_data["notes"] = notes
        
        # Update the application
        app_ref.update(update_data)
        
        return {"success": True, "message": "Application updated successfully"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error updating application status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update application: {str(e)}"
        )

def extract_skills_from_plain_text(text):
    """Extract skills from plain text using keyword matching and NLP."""
    if not text:
        return []
    
    # Convert to lowercase for case-insensitive matching
    text_lower = text.lower()
    found_skills = set()
    
    # Direct keyword matching
    for skill in KNOWN_SKILLS:
        if skill.lower() in text_lower:
            found_skills.add(skill)
    
    # N-gram matching for multi-word skills
    words = text_lower.split()
    for n in range(1, 4):  # Check 1, 2, and 3 word phrases
        for i in range(len(words) - n + 1):
            phrase = ' '.join(words[i:i+n])
            if phrase in KNOWN_SKILLS and phrase not in found_skills:
                found_skills.add(phrase)
    
    return list(found_skills)

def extract_from_plain_text(text):
    """Extract structured data from plain text using regex patterns."""
    if not text:
        return {}
    
    result = {
        'skills': extract_skills_from_plain_text(text),
        'experience': [],
        'education': []
    }
    
    # Simple regex patterns for experience and education
    exp_patterns = [
        r'(?i)(?:work|experience|employment)[\s\w]*?\n(.*?)(?=\n\n|$)',
        r'(?i)(?:job|position|role).*?\n(.*?)(?=\n\n|$)'
    ]
    
    edu_patterns = [
        r'(?i)(?:education|academic)[\s\w]*?\n(.*?)(?=\n\n|$)',
        r'(?i)(?:degree|diploma|certificate).*?\n(.*?)(?=\n\n|$)'
    ]
    
    # Extract experience
    for pattern in exp_patterns:
        matches = re.finditer(pattern, text, re.DOTALL)
        for match in matches:
            if match.group(1).strip():
                result['experience'].append({
                    'title': 'Work Experience',
                    'details': match.group(1).strip()
                })
    
    # Extract education
    for pattern in edu_patterns:
        matches = re.finditer(pattern, text, re.DOTALL)
        for match in matches:
            if match.group(1).strip():
                result['education'].append({
                    'degree': 'Education',
                    'details': match.group(1).strip()
                })
    
    return result

def infer_skills_from_text(text):
    """Infer skills from text content using NLP and keyword analysis."""
    if not text:
        return []
    
    # Basic keyword matching
    found_skills = set(extract_skills_from_plain_text(text))
    
    # If we still don't have enough skills, try to infer from context
    if len(found_skills) < 3:  # Arbitrary threshold
        # Look for common skill indicators
        skill_indicators = [
            'proficient in', 'experience with', 'skilled in', 'knowledge of',
            'familiar with', 'worked with', 'using', 'technologies:', 'skills:'
        ]
        
        for indicator in skill_indicators:
            idx = text.lower().find(indicator.lower())
            if idx != -1:
                # Extract text after the indicator
                snippet = text[idx + len(indicator):idx + 200]  # Look at next 200 chars
                # Extract potential skills (words that look like skills)
                words = re.findall(r'\b[a-zA-Z0-9#+]+\b', snippet)
                for word in words:
                    if len(word) > 2 and word.lower() in [s.lower() for s in KNOWN_SKILLS]:
                        found_skills.add(word)
    
    return list(found_skills)[:20]  # Limit to top 20 skills
