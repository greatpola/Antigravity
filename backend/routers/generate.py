from fastapi import APIRouter, HTTPException, Body, Depends
from routers.auth import verify_token
from config import get_db
from firebase_admin import firestore
import google.generativeai as genai

router = APIRouter(prefix="/generate", tags=["generate"])

class GenerationRequest:
    prompt: str
    style: str
    type: str  # basic, storyboard, mockup, emoticon

@router.post("/character")
async def generate_character(
    request: dict = Body(...),
    user_data: dict = Depends(verify_token)
):
    """
    Generate a refined character image based on the analysis.
    """
    try:
        # In a real scenario, we would use Imagen 3 model here.
        # For this demo/MVP, we will use Gemini 1.5 Pro to generate the prompt 
        # and then potentially call an image generation model if available, 
        # or return the refined prompt for the frontend to handle (or mock it).
        
        # NOTE: As of now, Imagen 3 via API might require specific access.
        # We will assume we are generating the *Prompt* for now, 
        # or using a placeholder for the actual image bytes if we can't call Imagen directly.
        
        prompt = request.get("prompt")
        style = request.get("style")
        gen_type = request.get("type", "basic")
        print(f"Received generation request: Prompt='{prompt}', Style='{style}', Type='{gen_type}', User='{user_data['uid']}'")
        
        # Check Credits
        db = get_db()
        if not db:
            raise HTTPException(status_code=500, detail="Database unavailable")
            
        user_ref = db.collection('users').document(user_data['uid'])
        
        # Transaction to safely check limits and deduct credit
        @firestore.transactional
        def check_and_deduct(transaction, doc_ref):
            snapshot = doc_ref.get(transaction=transaction)
            if not snapshot.exists:
                # Initialize if missing
                initial_data = {
                    "credits": 0, 
                    "isPremium": False,
                    "generation_count": 0,
                    "modification_count": 0
                }
                transaction.set(doc_ref, initial_data)
                return "free" # First one is free
            
            data = snapshot.to_dict()
            gen_count = data.get("generation_count", 0)
            credits = data.get("credits", 0)
            
            # Logic: 1 Free Generation
            if gen_count < 1:
                transaction.update(doc_ref, {"generation_count": firestore.Increment(1)})
                return "free"
            
            # Otherwise, check credits
            if credits < 1:
                raise ValueError("Insufficient credits")
            
            transaction.update(doc_ref, {
                "credits": firestore.Increment(-1),
                "generation_count": firestore.Increment(1)
            })
            return "paid"

        try:
            transaction = db.transaction()
            status = check_and_deduct(transaction, user_ref)
            print(f"Generation status: {status}")
        except ValueError as e:
            raise HTTPException(status_code=402, detail="Insufficient credits. You have used your free generation. Please upgrade.")
        except Exception as e:
            print(f"Transaction failed: {e}")
            raise HTTPException(status_code=500, detail="Transaction failed")

        # Refine Prompt (Simple concatenation for now to save latency, or use Gemini Text model)
        refined_prompt = f"{prompt}, {style} style"
        
        # Generate Image
        image_url = "https://via.placeholder.com/1024x1024.png?text=Generation+Failed"
        
        try:
            # Construct the full prompt
            full_prompt = f"{refined_prompt}. High quality, detailed, 8k."
            
            # Try to use Imagen model
            # Note: This requires the 'imagen-3.0-generate-001' or similar model to be available to the API key
            model = genai.GenerativeModel('imagen-3.0-generate-001')
            result = model.generate_images(
                prompt=full_prompt,
                number_of_images=1,
            )
            image_url = result.images[0].url
                
        except Exception as e:
            print(f"Image generation failed: {e}")
            
            # Fallback: Generate SVG using Gemini
            try:
                print("Attempting SVG generation fallback...")
                svg_model = genai.GenerativeModel('gemini-1.5-pro')
                svg_prompt = f"Generate a simple, cute SVG code for a {refined_prompt}. Return ONLY the SVG code, no markdown."
                svg_response = svg_model.generate_content(svg_prompt)
                svg_content = svg_response.text.replace("```svg", "").replace("```", "").strip()
                
                # Encode SVG to Data URI
                import base64
                encoded_svg = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
                image_url = f"data:image/svg+xml;base64,{encoded_svg}"
                print("SVG generation successful")
                
            except Exception as svg_e:
                print(f"SVG generation failed: {svg_e}")
                
                # Final Fallback: Unsplash (High Quality Real Images)
                # Use keywords from the prompt to find a relevant image
                keywords = prompt.split(" ")[0:3] # First 3 words
                search_term = ",".join(keywords)
                image_url = f"https://source.unsplash.com/1024x1024/?{search_term},{gen_type}"
                print(f"Using Unsplash fallback: {image_url}")
        
        # Save to Firestore
        try:
            doc_ref = db.collection('projects').document()
            doc_ref.set({
                'userId': user_data['uid'],
                'prompt': prompt,
                'refined_prompt': refined_prompt,
                'style': style,
                'type': gen_type,
                'image_url': image_url,
                'createdAt': firestore.SERVER_TIMESTAMP
            })
        except Exception as e:
            print(f"Failed to save project: {e}")

        return {
            "status": "success",
            "image_url": image_url,
            "refined_prompt": refined_prompt,
            "type": gen_type
        }

    except Exception as e:
        print(f"CRITICAL ERROR in generate_character: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.post("/modify")
async def modify_character(
    request: dict = Body(...),
    user_data: dict = Depends(verify_token)
):
    """
    Modify an existing character image.
    """
    try:
        project_id = request.get("projectId")
        modification_prompt = request.get("modificationPrompt")
        print(f"Received modification request: Project='{project_id}', Prompt='{modification_prompt}', User='{user_data['uid']}'")
        
        db = get_db()
        if not db:
            raise HTTPException(status_code=500, detail="Database unavailable")
            
        # 1. Get Original Project
        # In a real app, we would fetch the project to get the original prompt.
        # For simplicity, we'll assume the frontend passes the context or we just use the modification prompt as the new prompt.
        # Let's try to fetch if projectId is valid, otherwise rely on prompt.
        
        # 2. Check Credits (Modification Logic)
        user_ref = db.collection('users').document(user_data['uid'])
        
        @firestore.transactional
        def check_and_deduct_mod(transaction, doc_ref):
            snapshot = doc_ref.get(transaction=transaction)
            if not snapshot.exists:
                raise ValueError("User not found")
            
            data = snapshot.to_dict()
            mod_count = data.get("modification_count", 0)
            credits = data.get("credits", 0)
            
            # Logic: 1 Free Modification
            if mod_count < 1:
                transaction.update(doc_ref, {"modification_count": firestore.Increment(1)})
                return "free"
            
            # Otherwise, check credits
            if credits < 1:
                raise ValueError("Insufficient credits")
            
            transaction.update(doc_ref, {
                "credits": firestore.Increment(-1),
                "modification_count": firestore.Increment(1)
            })
            return "paid"

        try:
            transaction = db.transaction()
            status = check_and_deduct_mod(transaction, user_ref)
            print(f"Modification status: {status}")
        except ValueError as e:
            raise HTTPException(status_code=402, detail="Insufficient credits. You have used your free modification. Please upgrade.")
        except Exception as e:
            print(f"Transaction failed: {e}")
            raise HTTPException(status_code=500, detail="Transaction failed")

        # 3. Generate Modified Image
        # We reuse the generation logic. 
        # Ideally, we would use an image-to-image model, but for now we will do text-to-image with the modified prompt.
        full_prompt = f"{modification_prompt}. High quality, detailed, 8k."
        
        image_url = "https://via.placeholder.com/1024x1024.png?text=Modification+Failed"
        
        try:
            # Try Imagen
            model = genai.GenerativeModel('imagen-3.0-generate-001')
            result = model.generate_images(
                prompt=full_prompt,
                number_of_images=1,
            )
            image_url = result.images[0].url
        except Exception as e:
            print(f"Imagen modification failed: {e}")
            # Fallback: SVG
            try:
                svg_model = genai.GenerativeModel('gemini-1.5-pro')
                svg_prompt = f"Generate a simple, cute SVG code for: {modification_prompt}. Return ONLY the SVG code, no markdown."
                svg_response = svg_model.generate_content(svg_prompt)
                svg_content = svg_response.text.replace("```svg", "").replace("```", "").strip()
                import base64
                encoded_svg = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
                image_url = f"data:image/svg+xml;base64,{encoded_svg}"
            except Exception as svg_e:
                print(f"SVG modification failed: {svg_e}")
                # Fallback: Unsplash
                keywords = modification_prompt.split(" ")[0:3]
                search_term = ",".join(keywords)
                image_url = f"https://source.unsplash.com/1024x1024/?{search_term},modification"

        # 4. Save Project (New Version)
        try:
            doc_ref = db.collection('projects').document()
            doc_ref.set({
                'userId': user_data['uid'],
                'prompt': modification_prompt,
                'originalProjectId': project_id,
                'type': 'modification',
                'image_url': image_url,
                'createdAt': firestore.SERVER_TIMESTAMP
            })
        except Exception as e:
            print(f"Failed to save modified project: {e}")

        return {
            "status": "success",
            "image_url": image_url,
            "prompt": modification_prompt
        }

    except Exception as e:
        print(f"CRITICAL ERROR in modify_character: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Modification failed: {str(e)}")
