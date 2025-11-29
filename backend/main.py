import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_db

app = FastAPI(title="Antigravity API", version="1.0.0")

# CORS Configuration
origins = [
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Antigravity API is running", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include Routers
from routers import auth, analyze, generate, payments, projects

app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(generate.router)
app.include_router(payments.router)
app.include_router(projects.router)
