from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

from config import get_db

@router.get("/me")
async def get_current_user(user_data: dict = Depends(verify_token)):
    """
    Verify the current user's token and return their Firebase profile data + Firestore data.
    """
    uid = user_data["uid"]
    profile = {
        "uid": uid,
        "email": user_data.get("email"),
        "name": user_data.get("name"),
        "credits": 0,
        "isPremium": False
    }
    
    try:
        db = get_db()
        if db:
            doc_ref = db.collection('users').document(uid)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                profile.update(data)
            else:
                # Create initial user doc if not exists
                initial_data = {
                    "credits": 0, 
                    "isPremium": False, 
                    "email": user_data.get("email"),
                    "generation_count": 0,
                    "modification_count": 0
                }
                doc_ref.set(initial_data)
                profile.update(initial_data)
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        
    return profile
