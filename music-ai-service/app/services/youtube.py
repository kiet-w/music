import os
import tempfile
import yt_dlp
from supabase import create_client, Client
from app.worker import celery_app

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

@celery_app.task(bind=True)
def convert_and_upload_task(self, url: str):
    self.update_state(state='PROCESSING', meta={'progress': 0, 'status': 'Starting download...'})
    
    temp_dir = tempfile.mkdtemp()
    
    def my_hook(d):
        if d['status'] == 'downloading':
            try:
                percent_str = d.get('_percent_str', '0%').strip('\x1b[0;39m').strip('%')
                percent = float(percent_str)
                self.update_state(state='PROCESSING', meta={'progress': percent, 'status': 'Downloading...'})
            except:
                pass
        elif d['status'] == 'finished':
            self.update_state(state='PROCESSING', meta={'progress': 100, 'status': 'Converting and uploading...'})

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
        'postprocessors': [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3', 'preferredquality': '192'}],
        'quiet': True,
        'no_warnings': True,
        'extractor_retries': 3,
        'external_downloader': 'aria2c',
        'external_downloader_args': ['-x', '16', '-k', '1M'],
        'concurrent_fragment_downloads': 16,
        'progress_hooks': [my_hook],
        'max_filesize': 50000000, # 50MB limit to prevent abuse
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get('title', 'audio')
            safe_title = "".join([c for c in title if c.isalpha() or c.isdigit() or c==' ']).rstrip()
            filename = f"{safe_title}.mp3"
            filepath = os.path.join(temp_dir, filename)
            
            # Upload to Supabase
            supabase = get_supabase()
            with open(filepath, "rb") as f:
                supabase.storage.from_("downloads").upload(filename, f)
                
            # Get signed url (valid for 1 hour)
            res = supabase.storage.from_("downloads").create_signed_url(filename, 3600)
            signed_url = res['signedURL']
            
            return {'progress': 100, 'status': 'Completed', 'download_url': signed_url, 'filename': filename}
    finally:
        # Cleanup temp dir
        try:
            for root, dirs, files in os.walk(temp_dir, topdown=False):
                for name in files:
                    os.remove(os.path.join(root, name))
                for name in dirs:
                    os.rmdir(os.path.join(root, name))
            os.rmdir(temp_dir)
        except:
            pass
