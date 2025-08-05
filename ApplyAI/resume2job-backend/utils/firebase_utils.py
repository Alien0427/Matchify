import firebase_admin
from firebase_admin import credentials, firestore

def init_firebase():
    cred = credentials.Certificate("firebase_service_account.json")
    firebase_admin.initialize_app(cred)
    return firestore.client()

def ensure_collections_exist(db):
    # Firestore is schemaless, but we can create a dummy doc in each collection to ensure they exist
    collections = [
        'users', 'recruiters', 'jobs', 'applicants', 'verificationCodes'
    ]
    for col in collections:
        # Only create if collection is empty
        docs = list(db.collection(col).limit(1).stream())
        if not docs:
            db.collection(col).document('init').set({'init': True})

def ensure_messages_collection_exists(db):
    col = 'messages'
    docs = list(db.collection(col).limit(1).stream())
    if not docs:
        db.collection(col).document('init').set({'init': True})

def fetch_job_listings(db, collection="jobs"):
    job_docs = db.collection(collection).stream()
    jobs = []
    for doc in job_docs:
        job = doc.to_dict()
        job["job_id"] = doc.id
        # Normalize recruiterId field
        job["recruiterId"] = job.get("recruiterId") or job.get("recruiterID") or ""
        jobs.append(job)
    return jobs 