import os
import tempfile
from unittest.mock import patch, MagicMock
from app.services.youtube_service import YouTubeService

@patch("app.services.youtube_service.yt_dlp.YoutubeDL")
def test_extract_and_download_success(mock_ytdl):
    mock_instance = MagicMock()
    mock_ytdl.return_value.__enter__.return_value = mock_instance
    
    service = YouTubeService()
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create a dummy .mp3 file to simulate yt_dlp output
        dummy_file = os.path.join(temp_dir, "test_audio.mp3")
        with open(dummy_file, "w") as f:
            f.write("dummy audio")
            
        result = service.extract_and_download("http://youtube.com/watch?v=123", temp_dir)
        
        assert mock_instance.extract_info.called
        assert result == dummy_file
