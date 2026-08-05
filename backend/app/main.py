from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.upload import router as upload_router
from app.api.chat import router as chat_router
from app.api.dataset import router as dataset_router

app = FastAPI(title="DataPilot AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(dataset_router)

@app.get("/")
def root():
    return {"message": "Welcome to DataPilot AI"}

@app.get("/health")
def health():
    return {"status": "healthy"}