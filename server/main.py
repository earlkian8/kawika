import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

APP_ENV = os.getenv("APP_ENV", "development")
CLIENT_ORIGINS = os.getenv("CLIENT_ORIGINS", "http://localhost:5173").split(",")

app = FastAPI(
    title="Kawika API",
    description="Backend for Kawika, a gamified platform for learning Filipino Sign Language.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CLIENT_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Welcome to the Kawika API"}


@app.get("/api/health")
def health():
    return {"status": "ok", "env": APP_ENV}
