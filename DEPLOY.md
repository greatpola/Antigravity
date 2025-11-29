# Deployment Guide for Antigravity

## 1. Prerequisites
- Google Cloud SDK (`gcloud`) installed and logged in.
- Firebase CLI (`firebase`) installed and logged in.
- Docker installed (for local testing, optional for Cloud Run if using source deploy).

## 2. Deploy Backend (Cloud Run)
Run the following commands in your terminal:

```powershell
# 1. Set your Project ID
gcloud config set project YOUR_PROJECT_ID

# 2. Enable Services (if not already enabled)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# 3. Deploy to Cloud Run (from root directory)
gcloud run deploy antigravity-backend `
  --source ./backend `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --set-env-vars GOOGLE_API_KEY=your_key,STRIPE_SECRET_KEY=your_key
```

*Note: Replace `your_key` with your actual API keys or use Secret Manager.*

## 3. Deploy Frontend (Firebase Hosting)
Run the following commands:

```powershell
# 1. Build the Frontend
cd frontend
npm run build
cd ..

# 2. Initialize Firebase (if not done)
# Select Hosting, Firestore, Storage
firebase init

# 3. Deploy
firebase deploy
```

## 4. Connect Frontend to Backend
Once the Backend is deployed, copy the **Service URL** (e.g., `https://antigravity-backend-xyz.a.run.app`).
Update your frontend `.env` (or Firebase Hosting config) to point `VITE_API_URL` to this URL.
Then rebuild and redeploy the frontend.
