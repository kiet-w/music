from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from app.services.youtube import convert_and_upload_task
from app.worker import celery_app
from celery.result import AsyncResult

router = APIRouter(prefix="/youtube", tags=["youtube"])

class YoutubeConvertRequest(BaseModel):
    url: HttpUrl

@router.post("/convert")
async def start_conversion(request: YoutubeConvertRequest):
    # Basic validation of youtube URL
    url_str = str(request.url)
    if "youtube.com" not in url_str and "youtu.be" not in url_str:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
    task = convert_and_upload_task.delay(url_str)
    return {"task_id": task.id}

@router.get("/status/{task_id}")
async def get_status(task_id: str):
    task_result = AsyncResult(task_id, app=celery_app)
    if task_result.state == 'PENDING':
        return {"state": task_result.state, "progress": 0, "status": "Pending..."}
    elif task_result.state == 'PROCESSING':
        return {
            "state": task_result.state,
            "progress": task_result.info.get("progress", 0),
            "status": task_result.info.get("status", "")
        }
    elif task_result.state == 'SUCCESS':
        return {
            "state": task_result.state,
            "progress": 100,
            "status": task_result.info.get("status", ""),
            "download_url": task_result.info.get("download_url"),
            "filename": task_result.info.get("filename")
        }
    elif task_result.state == 'FAILURE':
        return {"state": task_result.state, "error": str(task_result.info)}
    return {"state": task_result.state}
