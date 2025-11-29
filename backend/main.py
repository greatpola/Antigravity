import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_db

app = FastAPI(title="Antigravity API", version="1.0.0")

# CORS Configuration
origins = [
    "http://localhost:5173",
    "https://studio-76b7b.web.app",
    "https://studio-76b7b.firebaseapp.com",
    "https://trovefy.io",
    "http://trovefy.io",
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.get("/")
# async def root():
#     return {"message": "Antigravity API is running", "status": "ok"}

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

# --- Serve React Frontend ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# 1. 리액트 빌드 파일(CSS, JS 등)이 있는 폴더를 연결합니다.
# 주의: 'dist' 폴더가 main.py와 같은 위치에 있어야 합니다.
app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

# 2. 그 외 모든 접속 요청에 대해 index.html을 보여줍니다. (새로고침 문제 해결)
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    # 파일이 존재하면 그 파일을 주고, 아니면 index.html을 줍니다 (SPA 라우팅)
    if os.path.exists(f"dist/{full_path}") and os.path.isfile(f"dist/{full_path}"):
        return FileResponse(f"dist/{full_path}")
    return FileResponse("dist/index.html")
