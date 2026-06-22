from supabase import create_client, Client
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        self.bucket_name = "music"

    def upload_mp3(self, user_id: str, job_id: str, file_path: str) -> str:
        file_name = f"downloads/{user_id}/{job_id}.mp3"
        with open(file_path, 'rb') as f:
            self.supabase.storage.from_(self.bucket_name).upload(file_name, f, {"content-type": "audio/mpeg"})
            
        public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(file_name)
        return public_url
