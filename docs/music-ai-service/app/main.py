from fastapi import FastAPI
from app.routers.health import router as health_router
from app.routers.youtube import router as youtube_router
from app.core.config import settings

app = FastAPI(title="Music App API")

app.include_router(health_router)
app.include_router(youtube_router)
