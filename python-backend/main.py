import os
import uuid
import tempfile
import logging
import json
from typing import Dict, Any, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
import yt_dlp
from dotenv import load_dotenv
import redis

# Load environment variables from .env file if it exists
load_dotenv()

# Configuration from environment variables
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", os.path.join(tempfile.gettempdir(), "music_converter_downloads"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Redis Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
USE_REDIS = os.getenv("USE_REDIS", "false").lower() == "true"

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("SongConverter")

app = FastAPI(
    title="Lean Music Converter API",
    description="High-performance, lightweight YouTube song converter microservice built with FastAPI & yt-dlp",
    version="1.0.0"
)

# CORS configuration to allow connections from Next.js Frontend & Capacitor Mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary directory for converted MP3 files
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Task storage - Redis for production, in-memory for development
redis_client = None
if USE_REDIS:
    try:
        redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD,
            db=REDIS_DB,
            decode_responses=True
        )
        # Test Redis connection
        redis_client.ping()
        logger.info(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
        tasks_db = None  # Using Redis instead
    except Exception as e:
        logger.warning(f"Failed to connect to Redis, falling back to in-memory storage: {e}")
        USE_REDIS = False
        tasks_db: Dict[str, Dict[str, Any]] = {}
else:
    logger.info("Using in-memory task storage (development mode)")
    tasks_db: Dict[str, Dict[str, Any]] = {}

def get_task(task_id: str) -> Optional[Dict[str, Any]]:
    """Get task from storage (Redis or in-memory)"""
    if USE_REDIS and redis_client:
        try:
            task_data = redis_client.get(f"task:{task_id}")
            return json.loads(task_data) if task_data else None
        except Exception as e:
            logger.error(f"Error getting task from Redis: {e}")
            return None
    else:
        return tasks_db.get(task_id) if tasks_db is not None else None

def set_task(task_id: str, task_data: Dict[str, Any]) -> None:
    """Set task in storage (Redis or in-memory)"""
    if USE_REDIS and redis_client:
        try:
            redis_client.setex(f"task:{task_id}", 3600, json.dumps(task_data))  # 1 hour expiry
        except Exception as e:
            logger.error(f"Error setting task in Redis: {e}")
    else:
        if tasks_db is not None:
            tasks_db[task_id] = task_data

class ConvertRequest(BaseModel):
    url: str
    albumId: Optional[str] = None

class SongInfoResponse(BaseModel):
    title: str
    artist: Optional[str] = None
    duration: Optional[int] = None
    thumbnail: Optional[str] = None

@app.get("/health")
def health_check():
    """Health check endpoint for liveness probe"""
    return {
        "status": "ok",
        "service": "Lean Music Converter",
        "environment": ENVIRONMENT,
        "timestamp": __import__('datetime').datetime.utcnow().isoformat()
    }

@app.get("/health/ready")
def readiness_check():
    """Readiness check endpoint - verifies service is ready to handle requests"""
    checks = {}
    
    # Check if output directory is writable
    try:
        test_file = os.path.join(OUTPUT_DIR, "test_write.tmp")
        with open(test_file, 'w') as f:
            f.write("test")
        os.remove(test_file)
        checks["storage"] = "ok"
    except Exception as e:
        checks["storage"] = f"error: {str(e)}"
    
    # Check task storage (Redis or in-memory)
    try:
        if USE_REDIS and redis_client:
            redis_client.ping()
            checks["task_storage"] = "ok (redis)"
        else:
            # Check if in-memory storage is working
            test_task_id = "health_check_test"
            test_data = {"test": True}
            if tasks_db is not None:
                tasks_db[test_task_id] = test_data
                _ = tasks_db.get(test_task_id)
                del tasks_db[test_task_id]
                checks["task_storage"] = "ok (in-memory)"
            else:
                checks["task_storage"] = "error: tasks_db is None"
    except Exception as e:
        checks["task_storage"] = f"error: {str(e)}"
    
    all_ok = all("ok" in status for status in checks.values())
    
    if not all_ok:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "environment": ENVIRONMENT,
                "timestamp": __import__('datetime').datetime.utcnow().isoformat(),
                "checks": checks
            }
        )
    
    return {
        "status": "ready",
        "environment": ENVIRONMENT,
        "timestamp": __import__('datetime').datetime.utcnow().isoformat(),
        "checks": checks
    }

@app.get("/info")
def get_song_info(url: str = Query(..., description="YouTube URL")):
    """Extract metadata (title, artist, duration, thumbnail) in ~0.5s without downloading the file."""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get("title") or "Unknown Title",
                "artist": info.get("uploader") or info.get("artist") or "Unknown Artist",
                "duration": info.get("duration"),
                "thumbnail": info.get("thumbnail"),
            }
    except Exception as e:
        logger.error(f"Failed to fetch info for {url}: {e}")
        raise HTTPException(status_code=400, detail=f"Cannot extract info: {str(e)}")

def process_youtube_download(task_id: str, url: str):
    """Background task function for downloading and converting audio using native yt_dlp."""
    # Update task status to downloading
    task_data = get_task(task_id)
    if task_data:
        task_data["status"] = "downloading"
        set_task(task_id, task_data)
    
    file_id = f"{task_id}.mp3"
    target_filepath = os.path.join(OUTPUT_DIR, file_id)
    output_template = os.path.join(OUTPUT_DIR, f"{task_id}.%(ext)s")

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get("title") or "Unknown Title"
            artist = info.get("uploader") or "Unknown Artist"

        if os.path.exists(target_filepath):
            task_data = get_task(task_id)
            if task_data:
                task_data.update({
                    "status": "completed",
                    "song": {
                        "id": task_id,
                        "title": title,
                        "artist": artist,
                        "filename": file_id,
                        "downloadUrl": f"/download/{file_id}",
                        "sizeBytes": os.path.getsize(target_filepath)
                    }
                })
                set_task(task_id, task_data)
            logger.info(f"Task {task_id} completed successfully.")
        else:
            raise Exception("Converted MP3 file not found after download.")
    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}")
        task_data = get_task(task_id)
        if task_data:
            task_data.update({
                "status": "failed",
                "error": str(e)
            })
            set_task(task_id, task_data)

@app.post("/convert")
def convert_song(request: ConvertRequest, background_tasks: BackgroundTasks):
    """Accept conversion request and start async processing in BackgroundTasks."""
    task_id = str(uuid.uuid4())
    task_data = {
        "id": task_id,
        "status": "pending",
        "url": request.url,
        "albumId": request.albumId,
    }
    set_task(task_id, task_data)
    
    background_tasks.add_task(process_youtube_download, task_id, request.url)
    return {"taskId": task_id, "status": "processing"}

@app.get("/status/{task_id}")
def get_task_status(task_id: str):
    """Check task completion status by taskId."""
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.get("/download/{filename}")
def download_converted_file(filename: str):
    """Stream or download the converted MP3 file."""
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath, media_type="audio/mpeg", filename=filename)

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting {ENVIRONMENT} environment server on {HOST}:{PORT}")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=ENVIRONMENT == "development")
