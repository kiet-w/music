import os
import yt_dlp
from app.core.config import settings

class YouTubeService:
    def extract_and_download(self, url: str, temp_dir: str, progress_callback=None) -> str:
        def hook(d):
            if d['status'] == 'downloading' and progress_callback:
                try:
                    # Robust progress extraction using downloaded_bytes / total_bytes
                    if d.get('total_bytes') or d.get('total_bytes_estimate'):
                        total = d.get('total_bytes') or d.get('total_bytes_estimate')
                        downloaded = d.get('downloaded_bytes', 0)
                        percent = (downloaded / total) * 100
                        progress_callback(percent)
                except Exception:
                    pass

        outtmpl = os.path.join(temp_dir, '%(title)s.%(ext)s')
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': outtmpl,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'progress_hooks': [hook] if progress_callback else [],
            'external_downloader': 'aria2c',
            'external_downloader_args': ['-x', '16', '-k', '1M', '-s', '16'],
            'match_filter': yt_dlp.utils.match_filter_func(
                lambda info, *args, **kwargs: 'Video is too long' if info.get('duration', 0) > settings.MAX_VIDEO_DURATION_SEC else None
            ),
            'max_filesize': settings.MAX_FILE_SIZE_BYTES,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.extract_info(url, download=True)
            
        files = os.listdir(temp_dir)
        mp3_file = next((f for f in files if f.endswith('.mp3')), None)
        
        if not mp3_file:
            raise Exception("Failed to extract MP3 file.")
            
        return os.path.join(temp_dir, mp3_file)
