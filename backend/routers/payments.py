from fastapi import APIRouter, Depends, HTTPException, Request, Header
from routers.auth import verify_token
from config import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, get_db
from firebase_admin import firestore
import stripe
import os

router = APIRouter(prefix="/payments", tags=["payments"])

stripe.api_key = STRIPE_SECRET_KEY
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

@router.post("/create-checkout-session")
async def create_checkout_session(user_data: dict = Depends(verify_token)):
    """
    Create a Stripe Checkout Session for the 'Coffee' product.
    """
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    # Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                    # For this demo, we use price_data to create a product on the fly
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': 'Antigravity Fuel (Coffee)',
                            'images': ['https://i.imgur.com/EHyR2nP.png'],
                        },
                        'unit_amount': 500, # $5.00
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url=FRONTEND_URL + '/dashboard?success=true',
            cancel_url=FRONTEND_URL + '/dashboard?canceled=true',
            client_reference_id=user_data['uid'],
            metadata={
                'uid': user_data['uid']
            }
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """
    Handle Stripe Webhooks to unlock features.
    """
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        uid = session.get('client_reference_id')
        
        if uid:
            print(f"Payment successful for user: {uid}")
            # Update user in Firestore
            db = get_db()
            if db:
                user_ref = db.collection('users').document(uid)
                user_ref.set({
                    'isPremium': True,
                    'credits': firestore.Increment(10) # Bonus credits
                }, merge=True)
            else:
                print("Firestore not initialized, skipping DB update.")

    return {"status": "success"}
