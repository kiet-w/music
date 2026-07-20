from fastapi import FastAPI
from app.routers.health import router as health_router

app = FastAPI(title="Music App API")

# Include routers
app.include_router(health_router)
