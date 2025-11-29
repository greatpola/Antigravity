import os
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Initialize Gemini
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Initialize Firebase
db = None
if not firebase_admin._apps:
    if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase Admin initialized with credentials file.")
    else:
        # Fallback to Application Default Credentials (Cloud Run)
        try:
            firebase_admin.initialize_app()
            db = firestore.client()
            print("Firebase Admin initialized with Default Credentials.")
        except Exception as e:
            print(f"Warning: Could not initialize Firebase Admin: {e}")
            db = None
else:
    db = firestore.client()

def get_db():
    return db
