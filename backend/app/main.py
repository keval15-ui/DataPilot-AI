from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.upload import router as upload_router
from app.api.chat import router as chat_router
from app.api.dataset import router as dataset_router
from app.api.quality import router as quality_router
from app.api.cleaning import router as cleaning_router

app = FastAPI(title="DataPilot AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(dataset_router)
app.include_router(quality_router)
app.include_router(cleaning_router)

@app.get("/")
def root():
    return {"message": "Welcome to DataPilot AI"}

@app.get("/health")
def health():
    import os
    return {
        "status": "healthy",
        "groq_model": os.getenv("GROQ_MODEL"),
        "has_api_key": bool(os.getenv("GROQ_API_KEY")),
        "supabase_url": os.getenv("SUPABASE_URL"),
    }