from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.worker import download_and_convert_task, redis_client
from app.repositories.job_repository import AsyncJobRepository
from app.core.database import get_async_db

router = APIRouter(prefix="/youtube", tags=["youtube"])

class YoutubeConvertRequest(BaseModel):
    url: HttpUrl
    user_id: str

@router.post("/convert")
async def start_conversion(request: YoutubeConvertRequest, db: AsyncSession = Depends(get_async_db)):
    url_str = str(request.url)
    if not any(domain in url_str for domain in ["youtube.com", "youtu.be", "soundcloud.com"]):
        raise HTTPException(status_code=400, detail="Invalid Audio URL")
    
    job_id = str(uuid.uuid4())
    job_repo = AsyncJobRepository(db)
    
    try:
        await job_repo.create_job(job_id, url_str, request.user_id)
    except Exception as e:
        # Note: Handle specific Foreign Key violation exceptions gracefully in real prod
        raise HTTPException(status_code=500, detail=str(e))
        
    download_and_convert_task.send(job_id, url_str, request.user_id)
    return {"job_id": job_id, "status": "PENDING"}

@router.get("/status/{job_id}")
async def get_status(job_id: str, db: AsyncSession = Depends(get_async_db)):
    job_repo = AsyncJobRepository(db)
    job = await job_repo.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    progress = job.progress
    if job.status == 'PROCESSING':
        redis_prog = redis_client.get(f"job_progress:{job_id}")
        if redis_prog is not None:
            progress = int(redis_prog)
    
    return {
        "job_id": job_id,
        "status": job.status,
        "progress": progress,
        "error": job.errorMessage,
        "download_url": job.downloadUrl
    }
