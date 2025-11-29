from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from routers.auth import verify_token
import google.generativeai as genai
from PIL import Image
import io

router = APIRouter(prefix="/analyze", tags=["analyze"])

@router.post("/")
async def analyze_image(
    file: UploadFile = File(...),
    user_data: dict = Depends(verify_token)
):
    """
    Upload an image and analyze it using Gemini Vision Pro.
    Returns a structured description of the character.
    """
    try:
        # Read image file
        contents = await file.read()
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from routers.auth import verify_token
import google.generativeai as genai
from PIL import Image
import io

router = APIRouter(prefix="/analyze", tags=["analyze"])

@router.post("/")
async def analyze_image(
    file: UploadFile = File(...),
    user_data: dict = Depends(verify_token)
):
    """
    Upload an image and analyze it using Gemini Vision Pro.
    Returns a structured description of the character.
    """
    try:
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Prepare Gemini Model
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        prompt = """
        Describe this character in detail for the purpose of regenerating it. 
        Focus on physical appearance, clothing, accessories, and distinct features.
        Also identify the art style (e.g., 3D render, anime, sketch).
        
        Format the output as a single descriptive paragraph followed by a new line and "Style: [Style Name]".
        """

        response = model.generate_content([prompt, image])
        text = response.text
        
        # Simple parsing
        description = text
        style = "3D Render" # Default
        
        if "Style:" in text:
            parts = text.split("Style:")
            description = parts[0].strip()
            style = parts[1].strip()
        
        return {
            "description": description,
            "style": style
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
