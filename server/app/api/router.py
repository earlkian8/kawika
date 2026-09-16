"""Collects every route module into one router mounted by the app."""

from fastapi import APIRouter

from app.api.routes import auth, health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
