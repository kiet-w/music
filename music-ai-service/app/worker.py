import dramatiq
from dramatiq.brokers.redis import RedisBroker
import redis
import tempfile
import shutil

from app.core.config import settings
from app.core.database import SessionLocal
from app.repositories.job_repository import JobRepository
from app.services.storage_service import StorageService
from app.services.youtube_service import YouTubeService

# Initialize Redis Broker at module level for Dramatiq
broker = RedisBroker(url=settings.REDIS_URL)
dramatiq.set_broker(broker)

redis_client = redis.Redis.from_url(settings.REDIS_URL)

@dramatiq.actor
def download_and_convert_task(job_id: str, url: str, user_id: str):
    # Initialize repo and services inside the task to prevent scale/test issues
    db = SessionLocal()
    job_repo = JobRepository(db)
    storage_service = StorageService()
    youtube_service = YouTubeService()
    
    temp_dir = tempfile.mkdtemp()

    def update_progress(percent: float):
        redis_client.setex(f"job_progress:{job_id}", 3600, int(percent))

    try:
        job_repo.update_job(job_id, status='PROCESSING')
        
        file_path = youtube_service.extract_and_download(url, temp_dir, update_progress)
        public_url = storage_service.upload_mp3(user_id, job_id, file_path)
        
        job_repo.update_job(job_id, status='COMPLETED', downloadUrl=public_url, progress=100)
        redis_client.setex(f"job_progress:{job_id}", 3600, 100)
        print(f"Job {job_id} completed successfully.")
            
    except Exception as e:
        print(f"Job {job_id} failed: {str(e)}")
        try:
            job_repo.update_job(job_id, status='FAILED', errorMessage=str(e))
        except Exception as db_e:
            print(f"Failed to update DB error state: {db_e}")
    finally:
        db.close()
        # Explicit cleanup of temp_dir
        shutil.rmtree(temp_dir, ignore_errors=True)
