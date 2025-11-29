# Deploy Script for Antigravity Project

$PROJECT_ID = "studio-76b7b"
$REGION = "us-central1"
$SERVICE_NAME = "studio-backend"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "Starting Deployment..." -ForegroundColor Green

# 1. Build Frontend
Write-Host "Building Frontend..." -ForegroundColor Cyan
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Frontend build failed"; exit 1 }
Set-Location ..

# 1.5 Copy Frontend to Backend (for Cloud Run serving)
Write-Host "Copying Frontend artifacts to Backend..." -ForegroundColor Cyan
if (Test-Path backend/dist) { Remove-Item backend/dist -Recurse -Force }
Copy-Item -Path frontend/dist -Destination backend/dist -Recurse

# 2. Build Backend Container
Write-Host "Building Backend Container..." -ForegroundColor Cyan
Set-Location backend
gcloud builds submit --tag $IMAGE_NAME --project $PROJECT_ID
if ($LASTEXITCODE -ne 0) { Write-Error "Backend build failed"; exit 1 }

# 3. Deploy to Cloud Run
Write-Host "Deploying to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $SERVICE_NAME --image $IMAGE_NAME --platform managed --region $REGION --allow-unauthenticated --project $PROJECT_ID
if ($LASTEXITCODE -ne 0) { Write-Error "Cloud Run deploy failed"; exit 1 }
Set-Location ..

# 4. Deploy to Firebase Hosting
Write-Host "Deploying to Firebase Hosting..." -ForegroundColor Cyan
firebase deploy --only hosting --project $PROJECT_ID
if ($LASTEXITCODE -ne 0) { Write-Error "Firebase deploy failed"; exit 1 }

Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Your site should be live at https://trovefy.io (if mapped) or the Firebase URL."
