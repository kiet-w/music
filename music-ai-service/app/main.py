from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from app.routers.health import router as health_router
from app.routers.youtube import router as youtube_router

app = FastAPI(title="Music App API")

# Include routers
app.include_router(health_router)
app.include_router(youtube_router)
