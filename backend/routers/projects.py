from fastapi import APIRouter, Depends, HTTPException
from routers.auth import verify_token
from config import get_db
from firebase_admin import firestore

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("/")
async def get_user_projects(user_data: dict = Depends(verify_token)):
    """
    Fetch all projects for the authenticated user.
    """
    try:
        db = get_db()
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        projects_ref = db.collection('projects')
        query = projects_ref.where('userId', '==', user_data['uid']).order_by('createdAt', direction=firestore.Query.DESCENDING)
        results = query.stream()
        
        projects = []
        for doc in results:
            data = doc.to_dict()
            # Convert timestamp to string
            if 'createdAt' in data and data['createdAt']:
                data['createdAt'] = data['createdAt'].isoformat()
            data['id'] = doc.id
            projects.append(data)
            
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
