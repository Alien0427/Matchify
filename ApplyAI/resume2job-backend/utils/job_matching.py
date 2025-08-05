from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from difflib import get_close_matches

def tfidf_cosine_match(resume_text, job_listings, top_k=3):
    job_texts = [job['description'] for job in job_listings]
    docs = [resume_text] + job_texts
    vectorizer = TfidfVectorizer().fit_transform(docs)
    vectors = vectorizer.toarray()
    resume_vec = vectors[0]
    job_vecs = vectors[1:]
    scores = cosine_similarity([resume_vec], job_vecs)[0]
    top_indices = scores.argsort()[-top_k:][::-1]
    results = []
    for idx in top_indices:
        job = job_listings[idx]
        results.append({
            "job": job,
            "score": float(scores[idx])
        })
    return results

def normalize_skill(skill):
    """Normalize skill name for better matching"""
    if not skill:
        return ""
    # Convert to lowercase and remove extra spaces
    normalized = skill.lower().strip()
    # Handle common variations and aliases
    variations = {
        # Web basics
        'html5': 'html',
        'html 5': 'html',
        'html': 'html',
        'css3': 'css',
        'css 3': 'css',
        'css': 'css',
        'scss': 'css',
        'sass': 'css',
        'less': 'css',
        # JavaScript and variants
        'javascript': 'javascript',
        'java script': 'javascript',
        'js': 'javascript',
        'es6': 'javascript',
        'es2015': 'javascript',
        'typescript': 'typescript',
        'ts': 'typescript',
        # Frontend frameworks
        'reactjs': 'react',
        'react.js': 'react',
        'react': 'react',
        'nextjs': 'next.js',
        'next.js': 'next.js',
        'vuejs': 'vue',
        'vue.js': 'vue',
        'vue': 'vue',
        'angularjs': 'angular',
        'angular.js': 'angular',
        'angular': 'angular',
        'sveltejs': 'svelte',
        'svelte.js': 'svelte',
        'svelte': 'svelte',
        # Backend frameworks
        'nodejs': 'node.js',
        'node.js': 'node.js',
        'node': 'node.js',
        'expressjs': 'express',
        'express.js': 'express',
        'express': 'express',
        'fastapi': 'fastapi',
        'flask': 'flask',
        'django': 'django',
        'springboot': 'spring boot',
        'spring boot': 'spring boot',
        # APIs
        'restapi': 'rest api',
        'rest api': 'rest api',
        'restfulapi': 'rest api',
        'restful api': 'rest api',
        'graphql': 'graphql',
        'soap': 'soap',
        # Databases
        'mongodb': 'mongodb',
        'mongo db': 'mongodb',
        'mongo': 'mongodb',
        'postgresql': 'postgresql',
        'postgres': 'postgresql',
        'postgre': 'postgresql',
        'mysql': 'mysql',
        'sqlite': 'sqlite',
        'redis': 'redis',
        'dynamodb': 'dynamodb',
        'cassandra': 'cassandra',
        'nosql': 'nosql',
        'sql': 'sql',
        # Cloud & DevOps
        'aws': 'aws',
        'amazon web services': 'aws',
        'gcp': 'gcp',
        'google cloud': 'gcp',
        'azure': 'azure',
        'docker': 'docker',
        'kubernetes': 'kubernetes',
        'k8s': 'kubernetes',
        'ci/cd': 'cicd',
        'cicd': 'cicd',
        'jenkins': 'jenkins',
        'github actions': 'github actions',
        'gitlab ci': 'gitlab ci',
        # Programming languages
        'python': 'python',
        'py': 'python',
        'java': 'java',
        'c++': 'c++',
        'cpp': 'c++',
        'c#': 'c#',
        'c sharp': 'c#',
        'c': 'c',
        'go': 'go',
        'golang': 'go',
        'ruby': 'ruby',
        'php': 'php',
        'swift': 'swift',
        'objective-c': 'objective-c',
        'objective c': 'objective-c',
        'typescript': 'typescript',
        # Data science & ML
        'scikit-learn': 'scikit-learn',
        'sklearn': 'scikit-learn',
        'pandas': 'pandas',
        'numpy': 'numpy',
        'matplotlib': 'matplotlib',
        'seaborn': 'seaborn',
        'tensorflow': 'tensorflow',
        'keras': 'keras',
        'pytorch': 'pytorch',
        'torch': 'pytorch',
        'ml': 'machine learning',
        'machine learning': 'machine learning',
        'deep learning': 'deep learning',
        'dl': 'deep learning',
        'nlp': 'nlp',
        'computer vision': 'computer vision',
        # Tools
        'git': 'git',
        'github': 'git',
        'gitlab': 'git',
        'bitbucket': 'git',
        'jira': 'jira',
        'figma': 'figma',
        'adobe xd': 'adobe xd',
        # UI frameworks
        'bootstrap': 'bootstrap',
        'material ui': 'material ui',
        'mui': 'material ui',
        'tailwindcss': 'tailwind css',
        'tailwind css': 'tailwind css',
        'ant design': 'ant design',
        'antd': 'ant design',
        # Other common
        'restful': 'rest api',
        'oop': 'oop',
        'object oriented programming': 'oop',
        'agile': 'agile',
        'scrum': 'scrum',
        'kanban': 'kanban',
        'jira': 'jira',
        'trello': 'trello',
        'notion': 'notion',
        'slack': 'slack',
        'firebase': 'firebase',
        'heroku': 'heroku',
        'vercel': 'vercel',
        'netlify': 'netlify',
        'webpack': 'webpack',
        'babel': 'babel',
        'vite': 'vite',
        'parcel': 'parcel',
        'eslint': 'eslint',
        'prettier': 'prettier',
        'storybook': 'storybook',
        'threejs': 'three.js',
        'three.js': 'three.js',
        'framer motion': 'framer motion',
        'motion': 'framer motion',
        # Add more as needed
    }
    return variations.get(normalized, normalized)

def skill_compatibility(resume_skills, job_skills):
    if not job_skills:
        return 0.0
    
    # Normalize all skills
    normalized_resume_skills = [normalize_skill(skill) for skill in resume_skills]
    normalized_job_skills = [normalize_skill(skill) for skill in job_skills]
    
    # Find exact matches first
    exact_matches = set(normalized_resume_skills) & set(normalized_job_skills)
    
    # Find fuzzy matches for remaining job skills
    fuzzy_matches = set()
    remaining_job_skills = set(normalized_job_skills) - exact_matches
    
    for job_skill in remaining_job_skills:
        # Use fuzzy matching with 80% similarity threshold
        close_matches = get_close_matches(job_skill, normalized_resume_skills, n=1, cutoff=0.8)
        if close_matches:
            fuzzy_matches.add(job_skill)
    
    # Combine exact and fuzzy matches
    total_matches = len(exact_matches) + len(fuzzy_matches)
    return round(total_matches / len(job_skills) * 100, 2)

def get_matched_and_missing_skills(resume_skills, job_skills):
    """Get matched and missing skills with fuzzy matching"""
    if not job_skills:
        return [], []
    
    # Normalize all skills
    normalized_resume_skills = [normalize_skill(skill) for skill in resume_skills]
    normalized_job_skills = [normalize_skill(skill) for skill in job_skills]
    
    # Create mapping from normalized to original
    resume_mapping = {normalize_skill(skill): skill for skill in resume_skills}
    job_mapping = {normalize_skill(skill): skill for skill in job_skills}
    
    # Find exact matches
    exact_matches = set(normalized_resume_skills) & set(normalized_job_skills)
    matched_skills = [job_mapping[match] for match in exact_matches]
    
    # Find fuzzy matches for remaining job skills
    remaining_job_skills = set(normalized_job_skills) - exact_matches
    fuzzy_matched_job_skills = set()
    
    for job_skill in remaining_job_skills:
        close_matches = get_close_matches(job_skill, normalized_resume_skills, n=1, cutoff=0.8)
        if close_matches:
            fuzzy_matched_job_skills.add(job_skill)
            matched_skills.append(job_mapping[job_skill])
    
    # Find missing skills (job skills that don't have exact or fuzzy matches)
    missing_normalized = remaining_job_skills - fuzzy_matched_job_skills
    missing_skills = [job_mapping[skill] for skill in missing_normalized]
    
    return matched_skills, missing_skills

def experience_compatibility(resume_experience, job_experience):
    """
    Simple overlap: counts how many job experience keywords are present in resume experience entries.
    """
    if not job_experience:
        return 0.0
    if not resume_experience:
        return 0.0
    # Lowercase and flatten
    resume_exp_text = ' '.join([str(e).lower() for e in resume_experience])
    matched = [kw for kw in job_experience if kw.lower() in resume_exp_text]
    return round(len(matched) / len(job_experience) * 100, 2)

def education_compatibility(resume_education, job_education):
    """
    Simple overlap: counts how many job education keywords are present in resume education entries.
    """
    if not job_education:
        return 0.0
    if not resume_education:
        return 0.0
    resume_edu_text = ' '.join([str(e).lower() for e in resume_education])
    matched = [kw for kw in job_education if kw.lower() in resume_edu_text]
    return round(len(matched) / len(job_education) * 100, 2)

def match_and_sort_jobs(resume_skills, job_listings, resume_experience=None, resume_education=None):
    """
    Returns job listings with a compatibility percentage, sorted descending.
    Uses weighted average of skills, experience, and education.
    Always includes matched_skills and missing_skills arrays.
    Preserves all original job fields including recruiterId.
    """
    jobs_with_scores = []
    for job in job_listings:
        # Extract required fields with fallbacks
        job_skills = job.get('skills_required', []) or job.get('skills', [])
        job_experience = job.get('experience_required', []) or job.get('experience', [])
        job_education = job.get('education_required', []) or job.get('education', [])
        
        # Calculate compatibility scores
        skill_score = skill_compatibility(resume_skills, job_skills)
        exp_score = experience_compatibility(resume_experience, job_experience) if resume_experience is not None else 0.0
        edu_score = education_compatibility(resume_education, job_education) if resume_education is not None else 0.0
        
        # Weights: skills 60%, experience 25%, education 15%
        compatibility = round(0.6 * skill_score + 0.25 * exp_score + 0.15 * edu_score, 2)
        
        # Get matched and missing skills
        matched_skills, missing_skills = get_matched_and_missing_skills(resume_skills, job_skills)
        
        # Create a new job object with all original fields plus the new ones
        job_with_scores = {
            **job,  # Include all original job fields
            'compatibility': compatibility,
            'skill_score': skill_score,
            'exp_score': exp_score,
            'edu_score': edu_score,
            'matched_skills': matched_skills,
            'missing_skills': missing_skills,
            # Ensure these fields are included even if not in the original job
            'recruiterId': job.get('recruiterId'),
            'id': job.get('id') or job.get('job_id'),
            'job_id': job.get('job_id') or job.get('id'),
        }
        
        jobs_with_scores.append(job_with_scores)
    
    # Sort by compatibility score in descending order
    sorted_jobs = sorted(jobs_with_scores, key=lambda x: x['compatibility'], reverse=True)
    return sorted_jobs