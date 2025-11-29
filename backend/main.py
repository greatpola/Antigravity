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
# --- Serve React Frontend ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# [중요] dist 폴더가 없으면 에러가 나므로 확인하는 로직 추가
if os.path.exists("dist/assets"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
else:
    print("경고: 'dist/assets' 폴더를 찾을 수 없습니다. 리액트 빌드 파일이 배포되었는지 확인하세요.")

# 1. 메인 페이지("/") 접속 시 index.html 반환 (이게 없으면 404가 뜰 수 있음)
@app.get("/")
async def serve_spa_root():
    if os.path.exists("dist/index.html"):
        return FileResponse("dist/index.html")
    return {"message": "프론트엔드 파일(dist/index.html)이 없습니다. 로컬에서 빌드 후 push했는지 확인하세요."}

# 2. 그 외 모든 경로(SPA 라우팅) 처리
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    file_path = f"dist/{full_path}"
    # 파일이 실제로 존재하면 그 파일을 줌 (이미지, 아이콘 등)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    # 아니면 리액트의 index.html로 보내서 라우팅 처리
    if os.path.exists("dist/index.html"):
        return FileResponse("dist/index.html")
    return {"error": "Frontend build missing"}