import os
import uuid
import tempfile
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
import yt_dlp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SongConverter")

app = FastAPI(
    title="Lean Music Converter API",
    description="High-performance, lightweight YouTube song converter microservice built with FastAPI & yt-dlp",
    version="1.0.0"
)

# CORS configuration to allow connections from Next.js Frontend & Capacitor Mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary directory for converted MP3 files
OUTPUT_DIR = os.path.join(tempfile.gettempdir(), "music_converter_downloads")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# In-memory task status storage (for MVP without Redis)
tasks_db: Dict[str, Dict[str, Any]] = {}

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
    return {"status": "ok", "service": "Lean Music Converter"}

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
    tasks_db[task_id]["status"] = "downloading"
    
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
            tasks_db[task_id].update({
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
            logger.info(f"Task {task_id} completed successfully.")
        else:
            raise Exception("Converted MP3 file not found after download.")
    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}")
        tasks_db[task_id].update({
            "status": "failed",
            "error": str(e)
        })

@app.post("/convert")
def convert_song(request: ConvertRequest, background_tasks: BackgroundTasks):
    """Accept conversion request and start async processing in BackgroundTasks."""
    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {
        "id": task_id,
        "status": "pending",
        "url": request.url,
        "albumId": request.albumId,
    }
    
    background_tasks.add_task(process_youtube_download, task_id, request.url)
    return {"taskId": task_id, "status": "processing"}

@app.get("/status/{task_id}")
def get_task_status(task_id: str):
    """Check task completion status by taskId."""
    task = tasks_db.get(task_id)
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
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
